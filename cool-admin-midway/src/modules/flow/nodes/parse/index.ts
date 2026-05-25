import { Inject, Provide, Scope, ScopeEnum } from '@midwayjs/core';
import { FlowNode } from '../../runner/node';
import { FlowContext } from '../../runner/context';
import { FlowResult } from '../../runner/result';
import { FlowConfigService } from '../../service/config';
import { NodeLLMModel } from '../llm/model';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { ChatPromptTemplate } from '@langchain/core/prompts';

/**
 * 解析器
 */
@Provide()
@Scope(ScopeEnum.Prototype)
export class NodeParse extends FlowNode {
  @Inject()
  nodeLLMModel: NodeLLMModel;

  @Inject()
  flowConfigService: FlowConfigService;

  /**
   * 执行
   * @param context
   */
  async run(context: FlowContext): Promise<FlowResult> {
    const { outputParams } = this.config;
    const { model } = this.config.options;

    // 获得输入参数
    const params = this.inputParams;

    // 获取流程配置
    const config = await this.flowConfigService.getOptions(model.configId);

    // 获取模型
    const llm = await this.getModel(model.supplier, {
      ...model.params,
      ...config.comm,
    });

    // 获得提示配置
    const prompt = await this.getPrompt();
    const chain = prompt.pipe(llm);

    // 获得提示格式
    const format = await this.getFormat(outputParams);
    const res = await chain.invoke({
      content: `input: ${params.text} format: '{${format}}'`,
    });

    // 获取执行结果
    const extractResult = this.extractJSON(res.content);

    for (const param of outputParams) {
      if (param.field == 'result') {
        context.set(
          `${this.getPrefix()}.${param.field}`,
          extractResult,
          'output'
        );
      } else {
        context.set(
          `${this.getPrefix()}.${param.field}`,
          extractResult[param.field],
          'output'
        );
      }
    }

    // 更新计数器
    context.updateCount(
      'tokenUsage',
      (res.usage_metadata as any)?.total_tokens || 0
    );

    return {
      success: true,
      result: {
        ...extractResult,
        result: extractResult,
      },
    };
  }

  /**
   * 获得提示模板
   * @returns
   */
  async getPrompt() {
    // 转换格式
    const prompt = ChatPromptTemplate.fromMessages([
      [
        'system',
        `You are now acting as an information extraction tool. When you receive any input, you need to extract the relevant information from it and output the extracted information in the requested JSON format, without replying with any other irrelevant content.`,
      ],
      ['human', '{content}'],
    ]);

    return prompt;
  }

  /**
   * 获得提示格式
   * @param outputParams // 输出参数
   * @returns
   */
  async getFormat(outputParams) {
    return (
      outputParams
        ?.filter(param => param.field != 'result')
        ?.map(param => `"${param.field}": "${param.type}"`)
        ?.join(',') ?? ''
    );
  }

  /**
   * 从文本中提取JSON字符串，并尝试解析为对象
   * @param str 待提取的文本
   * @returns 对象
   */
  extractJSON(str) {
    // 使用正则表达式匹配JSON字符串
    const jsonRegex = /\{(?:[^{}]|(?:\{[^{}]*\}))*\}/g;
    const jsonStrings = str.match(jsonRegex);

    const result = jsonStrings ? jsonStrings : null;
    return JSON.parse(result);
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
}
