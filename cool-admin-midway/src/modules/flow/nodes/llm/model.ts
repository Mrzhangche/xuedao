import { ChatMinimax } from '@langchain/community/chat_models/minimax';
import { ChatAlibabaTongyi } from '@langchain/community/chat_models/alibaba_tongyi';
import { ChatZhipuAI } from '@langchain/community/chat_models/zhipuai';
import { Provide } from '@midwayjs/core';
import { ChatOpenAI } from '@langchain/openai';
import { ChatOllama } from '@langchain/ollama';
import { ChatDeepSeek } from '@langchain/deepseek';
import { AzureOpenAI } from '@langchain/openai';

/**
 * 模型类型
 */
export const CommModel = {
  // openai
  openai: ChatOpenAI,
  // minimax
  minimax: ChatMinimax,
  // 通义千问
  tongyi: ChatAlibabaTongyi,
  // 智谱AI
  zhipu: ChatZhipuAI,
  // ollama 本地大模型
  ollama: ChatOllama,
  // deepseek
  deepseek: ChatDeepSeek,
  // azure
  azure: AzureOpenAI,
};

// LLM类型键
export type LLMModelType = keyof typeof CommModel;

/**
 * LLM大模型节点
 */
@Provide()
export class NodeLLMModel {
  /**
   * 获得模型
   * @param name
   * @returns
   */
  async getModel(
    name: string
  ): Promise<
    ChatOpenAI | ChatMinimax | ChatAlibabaTongyi | ChatOllama | ChatDeepSeek
  > {
    return CommModel[name];
  }
}
