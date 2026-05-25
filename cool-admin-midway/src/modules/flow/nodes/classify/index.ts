import { Inject, Provide, Scope, ScopeEnum } from '@midwayjs/core';
import { FlowNode } from '../../runner/node';
import { FlowContext, FlowGraph } from '../../runner/context';
import { FlowResult } from '../../runner/result';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { FlowConfigService } from '../../service/config';
import { NodeLLMModel } from '../llm/model';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { CoolCommException } from '@cool-midway/core';

/**
 * 分类器
 */
@Provide()
@Scope(ScopeEnum.Prototype)
export class NodeClassify extends FlowNode {
  @Inject()
  nodeLLMModel: NodeLLMModel;

  @Inject()
  flowConfigService: FlowConfigService;

  /**
   * 执行
   * @param context
   * @returns
   */
  async run(context: FlowContext): Promise<FlowResult> {
    const { model, types } = this.config.options;
    const config = await this.flowConfigService.getOptions(model.configId);
    const params = this.inputParams;
    const llm = await this.getModel(model.supplier, {
      ...model.params,
      ...config.comm,
    });
    const prompt = await this.getPrompt(types);
    const chain = prompt.pipe(llm);
    const res = await chain.invoke({
      content: params.content,
      format: '{ "index": "数字类型，分类的序号，如：0" }',
    });
    const result: {
      index: number;
    } = this.extractJSON(res.content);
    context.set(`${this.getPrefix()}.index`, result.index, 'output');
    context.set(`${this.getPrefix()}.content`, types[result.index], 'output');
    const nextNode = await this.nextNode(result.index, context.getFlowGraph());
    // 更新计数器
    context.updateCount(
      'tokenUsage',
      (res.usage_metadata as any)?.total_tokens || 0
    );
    return {
      success: true,
      result: {
        index: result.index,
        content: types[result.index],
      },
      next: nextNode,
    };
  }

  /**
   * 获得提示模板
   * @param content
   * @returns
   */
  async getPrompt(types: string[]) {
    // 转换格式
    const prompt = ChatPromptTemplate.fromMessages([
      [
        'system',
        `根据用户的问题，从下面分类中选择一个，并按照JSON格式 {format} 返回给我。
        序号${types
          .map((content, index) => `${index}. ${content}`)
          .join('\n')}`,
      ],
      ['human', '{content}'],
    ]);
    return prompt;
  }

  /**
   * 获得模型
   * @param name 名称
   * @param options 配置
   * @returns
   */
  async getModel(name: string, options: any): Promise<BaseChatModel> {
    const LLM = await this.nodeLLMModel.getModel(name);
    // @ts-ignore
    return new LLM(options);
  }

  /**
   * 从文本中提取JSON字符串，并尝试解析为对象
   * @param str 待提取的文本
   * @returns 对象
   */
  extractJSON(str) {
    try {
      // 使用正则表达式匹配JSON字符串
      const jsonRegex = /\{(?:[^{}]|(?:\{[^{}]*\}))*\}/g;
      const jsonStrings = str.match(jsonRegex);

      const result = jsonStrings ? jsonStrings : null;
      return JSON.parse(result);
    } catch (e) {
      throw new CoolCommException('JSON解析失败');
    }
  }

  /**
   * 下一个节点ID
   * @param index
   * @param flowGraph
   */
  async nextNode(index: number, flowGraph: FlowGraph) {
    // 找到所有的线
    const edges = flowGraph.edges.filter(edge => edge.source == this.id);
    // 找到所有线中sourceHandle为index的线
    const edgesFilter = edges.filter(
      edge => edge.sourceHandle == `source-${index}`
    );
    const nexts = flowGraph.nodes.filter(node =>
      edgesFilter.some(edge => edge.target == node.id)
    );
    return nexts.map(e => ({
      id: e.id,
      type: e.type,
    }));
  }
}
