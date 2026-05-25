import { Provide, Scope, ScopeEnum } from '@midwayjs/core';
import { FlowNode } from '../../runner/node';
import { FlowContext, FlowGraph } from '../../runner/context';
import * as _ from 'lodash';
import { FlowResult } from '../../runner/result';

/**
 * 条件
 */
interface Condition {
  /** 条件 */
  condition: string;
  /** 节点ID */
  nodeId: string;
  /** 节点类型 */
  nodeType: string;
  /** 字段 */
  field: string;
  /** 操作符 */
  operator: string;
  /** 值 */
  value: string;
}

/**
 * 配置
 */
interface Options {
  IF: Condition[];
  ELSE: [];
}

/**
 * 对比结果
 */
interface EqResult {
  /** 结果 */
  result: boolean;
  /** 操作符 */
  operator: 'AND' | 'OR';
}

// 条件对应的方法
const methods = {
  /** 包含 */
  include: (paramValue: string, value: string) => _.includes(paramValue, value),
  /** 不包含 */
  exclude: (paramValue: string, value: string) =>
    !_.includes(paramValue, value),
  /** 开始是 */
  startWith: (paramValue: string, value: string) =>
    _.startsWith(paramValue, value),
  /** 结束是 */
  endWith: (paramValue: string, value: string) => _.endsWith(paramValue, value),
  /** 等于 */
  equal: (paramValue: string, value: string) => _.isEqual(paramValue, value),
  /** 不等于 */
  notEqual: (paramValue: string, value: string) =>
    !_.isEqual(paramValue, value),
  /** 大于 */
  greaterThan: (paramValue: string, value: string) => _.gt(paramValue, value),
  /** 大于等于 */
  greaterThanOrEqual: (paramValue: string, value: string) =>
    _.gte(paramValue, value),
  /** 小于 */
  lessThan: (paramValue: string, value: string) => _.lt(paramValue, value),
  /** 小于等于 */
  lessThanOrEqual: (paramValue: string, value: string) =>
    _.lte(paramValue, value),
  /** 为空 */
  isNull: (paramValue: string) => _.isNull(paramValue),
  /** 不为空 */
  isNotNull: (paramValue: string) => !_.isNull(paramValue),
};

/**
 * 判断器
 */
@Provide()
@Scope(ScopeEnum.Prototype)
export class NodeJudge extends FlowNode {
  /**
   * 执行
   * @param context
   */
  async run(context: FlowContext): Promise<FlowResult> {
    const { IF } = this.config.options as Options;
    const datas = context.getData('output') as Map<string, any>;
    const eqResult: EqResult[] = [];
    for (const item of IF) {
      const paramValue = datas.get(
        `${item.nodeType}.${item.nodeId}.${item.field}`
      );
      const value = item.value;
      const result = await this.eq(paramValue, value, item.condition);
      eqResult.push({
        result: result,
        operator: item.operator as 'AND' | 'OR',
      });
    }
    const result = await this.result(eqResult);
    context.set(`${this.getPrefix()}.result`, result, 'output');
    const nextIds = await this.nextNode(context.getFlowGraph(), result);
    return {
      success: true,
      result,
      next: nextIds,
    };
  }

  /**
   * 获取输入参数
   * @returns
   */
  getInputParams(context: FlowContext) {
    const { IF } = this.config.options as Options;
    const datas = context.getData('output') as Map<string, any>;
    const params = {};
    for (const item of IF) {
      const paramValue = datas.get(
        `${item.nodeType}.${item.nodeId}.${item.field}`
      );
      const node = this.context
        .getFlowGraph()
        .nodes.find(e => e.id == item.nodeId);
      if (node) {
        params[`${node.label}.${item.field}`] = paramValue;
      }
    }
    return params;
  }

  /**
   * 下一个节点ID
   * @param flowGraph
   * @param result
   * @returns
   */
  async nextNode(flowGraph: FlowGraph, result: boolean) {
    // 找到所有的线
    const edges = flowGraph.edges.filter(edge => edge.source == this.id);
    // 找到所有线中sourceHandle为 source-if 或 source-else 的线
    const edgesFilter = edges.filter(
      edge => edge.sourceHandle == (result ? 'source-if' : 'source-else')
    );
    const nexts = flowGraph.nodes.filter(node =>
      edgesFilter.some(edge => edge.target == node.id)
    );
    return nexts.map(e => ({
      id: e.id,
      type: e.type,
    }));
  }

  /**
   * 结果
   * @param eqResult
   */
  async result(eqResult: EqResult[]) {
    let result = null;
    for (const item of eqResult) {
      if (result == null) {
        result = item.result;
        continue;
      }
      if (item.operator == 'AND') {
        result = result && item.result;
      } else {
        result = result || item.result;
      }
    }
    return result;
  }

  /**
   * 对比
   * @param paramValue
   * @param value
   * @param condition
   * @returns
   */
  async eq(paramValue: string, value: string, condition: string) {
    const method = await this.conditonMethod(condition);
    return method(paramValue, value);
  }

  /**
   * 将条件转为 lodash 具体方法
   * @param condition
   */
  async conditonMethod(condition: string) {
    return methods[condition];
  }
}
