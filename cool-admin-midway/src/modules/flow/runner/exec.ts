import { FlowContext, FlowGraph, NodeInfo } from './context';
import { START, END, StateGraph } from '@langchain/langgraph';
import { FlowNode } from './node';
import { CoolCommException } from '@cool-midway/core';
import * as moment from 'moment';
import { FlowState } from './state';
import { EventEmitter } from 'events';

/**
 * 执行器
 */
export class FlowExecutor {
  // 流程图
  flowGraph: FlowGraph;
  // 上下文
  context: FlowContext;
  // 节点
  flowNode: FlowNode[];

  // 回调函数
  private callback?: (res) => void;

  setFlowGraph(flowGraph: FlowGraph) {
    this.flowGraph = flowGraph;
  }

  setContext(context: FlowContext) {
    this.context = context;
  }

  setFlowNode(flowNode: FlowNode[]) {
    this.flowNode = flowNode;
  }

  /**
   * 发送回调消息
   */
  private sendCallback(msgType: 'flow' | 'node', data: any) {
    this.callback && this.callback({ msgType, data });
  }

  /**
   * 执行一个节点
   * @param node
   */
  async oneNode(nodeId: string) {
    // 如果未提供节点ID，直接返回
    if (!nodeId) return;
    this.context.setDebugOne(true);
    // 查找指定的节点
    const targetNode = this.flowGraph.nodes.find(node => node.id === nodeId);
    if (!targetNode) {
      throw new CoolCommException('指定的节点不存在');
    }
    this.flowGraph.nodes = [targetNode];
    this.flowNode = [this.flowNode.find(node => node.id == nodeId)];
    return targetNode;
  }

  /**
   * 执行流程
   */
  async run(nodeId?: string, callback?: (res) => void) {
    EventEmitter.defaultMaxListeners = 100;
    const oneNode = await this.oneNode(nodeId);
    this.context.setStartTime(new Date());
    this.callback = callback;
    this.sendCallback('flow', { status: 'start' });

    // 状态
    const builder = new StateGraph(FlowState);
    // 添加节点
    await this.addNode(builder, oneNode);
    // 添加边
    await this.addEdge(builder, oneNode);
    // 编译
    const graph = builder.compile();
    const tasks = [];
    const controller = new AbortController();
    this.context.addCancelListener(() => {
      controller.abort();
      controller == null;
    });
    let flowResult;
    if (this.context.isInternal()) {
      await graph.invoke({ context: this.context });
      return this.context.getFlowResult();
    }
    try {
      // 执行
      for await (const chunk of await graph.stream(
        { context: this.context },
        {
          streamMode: 'debug',
          signal: controller.signal,
          runId: this.context.getRequestId(),
        }
      )) {
        tasks.push(chunk);
        const nodeType = (chunk as any).payload.name.split('-')[0];
        const nodeId = (chunk as any).payload.name.split('-')[1];
        const status = (chunk as any).type == 'task' ? 'running' : 'done';
        const result = this.context.get(nodeId, 'result');
        let nextNodeIds = [];
        if (
          status == 'done' &&
          ['judge', 'classify'].includes(nodeType) &&
          result
        ) {
          nextNodeIds = result.next.map(e => e.id);
        }
        if ((chunk as any).type == 'task_result') {
          flowResult = result;
        }
        this.sendCallback('node', {
          status,
          nodeId,
          nodeType,
          duration:
            status == 'done'
              ? this.context.getNodeRunInfo(nodeId)?.duration
              : null,
          result:
            status == 'done'
              ? {
                  success: result.success,
                  error: result.error,
                }
              : {},
          nextNodeIds,
        });
      }
      this.sendCallback('flow', {
        status: 'end',
        reason: 'success',
        duration: moment().diff(this.context.getStartTime(), 'milliseconds'),
        count: this.context.getCount(),
        result: flowResult,
      });
    } catch (e) {
      if (e.message == 'Aborted') {
        // this.logger.warn('流程已取消');
        this.sendCallback('flow', {
          status: 'end',
          reason: 'cancel',
          duration: moment().diff(this.context.getStartTime(), 'milliseconds'),
          count: this.context.getCount(),
        });
      } else {
        controller.abort();
        controller == null;
        console.log('请求ID', this.context.getRequestId());
        // this.logger.error(e);
        this.sendCallback('flow', {
          status: 'end',
          reason: 'error',
          duration: moment().diff(this.context.getStartTime(), 'milliseconds'),
          count: this.context.getCount(),
        });
        flowResult = {
          success: false,
          error: e.message,
        };
      }
    } finally {
      controller == null;
    }
    return flowResult;
  }

  /**
   * 添加节点
   * @param builder
   */
  async addNode(
    builder: StateGraph<typeof FlowState.State>,
    oneNode?: NodeInfo
  ) {
    if (oneNode) {
      builder.addNode(`${oneNode.type}-${oneNode.id}`, {
        fn: async (state: typeof FlowState.State) => {
          const context = state.context;
          const result = await this.flowNode[0].invoke(context);
          context.set(oneNode.id, result, 'result');
        },
      });
      return;
    }
    // 去除judge和classify节点以及没有任何连线的节点
    for (const node of this.flowNode) {
      // 检查节点是否有连线（作为源节点或目标节点）
      const hasConnection = this.flowGraph.edges.some(
        edge => edge.source === node.id || edge.target === node.id
      );
      // 跳过没有连线的节点
      if (!hasConnection) {
        continue;
      }
      builder.addNode(`${node.type}-${node.id}`, {
        fn: async (state: typeof FlowState.State) => {
          if (node.type == 'judge' || node.type == 'classify') {
            return;
          }
          const context = state.context;
          const result = await node.invoke(context);
          context.set(node.id, result, 'result');
          if (!result.success) {
            throw new Error(`报错中断[${node.type}节点]：${result.error}`);
          }
        },
      });
    }
  }

  /**
   * 添加边
   * @param builder
   */
  async addEdge(
    builder: StateGraph<{ context: FlowContext }>,
    oneNode?: NodeInfo
  ) {
    if (oneNode) {
      // @ts-ignore
      builder.addEdge(START, `${oneNode.type}-${oneNode.id}`);
      // @ts-ignore
      builder.addEdge(`${oneNode.type}-${oneNode.id}`, END);
      return;
    }
    // 找到开始节点
    const startNode = this.flowGraph.nodes.find(node => node.type === 'start');
    if (!startNode) {
      throw new CoolCommException('开始节点不存在');
    }
    // 开始节点
    // @ts-ignore
    builder.addEdge(START, `${startNode.type}-${startNode.id}`);
    // 找出条件节点
    const judgeNodes = this.flowGraph.nodes.filter(
      node => node.type === 'judge' || node.type === 'classify'
    );
    for (const judgeNode of judgeNodes) {
      // 找出所有该条件节点的目标节点
      const targetNodes = this.flowGraph.edges.filter(
        edge =>
          edge.source === judgeNode.id &&
          (edge.sourceType === 'judge' || edge.sourceType === 'classify')
      );
      builder.addConditionalEdges(
        // @ts-ignore
        `${judgeNode.type}-${judgeNode.id}`,
        async (state: typeof FlowState.State) => {
          const node = this.flowNode.find(node => node.id === judgeNode.id);
          const context = state.context;
          const result = await node.invoke(context);
          context.set(node.id, result, 'result');
          if (!result.success) {
            throw new CoolCommException(result.error.message);
          }
          return result.next.map(e => `${e.type}-${e.id}`);
        },
        targetNodes.map(node => `${node.targetType}-${node.target}`)
      );
    }
    // 过滤掉judge和classify节点
    const edges = this.flowGraph.edges.filter(
      edge => edge.sourceType !== 'judge' && edge.sourceType !== 'classify'
    );
    for (const edge of edges) {
      builder.addEdge(
        // @ts-ignore
        `${edge.sourceType}-${edge.source}`,
        `${edge.targetType}-${edge.target}`
      );
    }
    // 找出所有的结束节点
    const endNodes = this.flowGraph.nodes.filter(node => node.type === 'end');
    for (const endNode of endNodes) {
      // @ts-ignore
      builder.addEdge(`${endNode.type}-${endNode.id}`, END);
    }
  }
}
