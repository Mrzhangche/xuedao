import { OpenAIEmbeddings } from '@langchain/openai';
import { ZhipuAIEmbeddings } from '@langchain/community/embeddings/zhipuai';
import { MinimaxEmbeddings } from '@langchain/community/embeddings/minimax';
import { OllamaEmbeddings } from '@langchain/ollama';
import { AlibabaTongyiEmbeddings } from '@langchain/community/embeddings/alibaba_tongyi';
import { ByteDanceDoubaoEmbeddings } from '@langchain/community/embeddings/bytedance_doubao';
import { SiliconflowEmbeddings } from './siliconflow';

/**
 * 向量化模型，你还可以添加其他向量化模型，https://js.langchain.com/v0.2/docs/integrations/text_embedding
 */
export const EmbeddModel = {
  // 字节跳动，https://bytedance.com
  doubao: (options: any) => {
    return new ByteDanceDoubaoEmbeddings(options);
  },
  // OpenAI Embeddings，也适用支持openai api格式的其他向量化模型
  openai: (options: any) => {
    return new OpenAIEmbeddings(options);
  },
  // 智谱，https://www.zhipu.ai
  zhipu: (options: any) => {
    return new ZhipuAIEmbeddings({
      apiKey: options.apiKey,
      modelName: options.model,
    });
  },
  // 通义，https://tongyi.aliyun.com
  tongyi: (options: any) => {
    return new AlibabaTongyiEmbeddings(options);
  },
  // minimax，https://www.minimaxi.com
  minimax: (options: any) => {
    return new MinimaxEmbeddings(options);
  },
  // ollama，本地大模型，https://ollama.com
  ollama: (options: any) => {
    return new OllamaEmbeddings(options);
  },
  // 硅基流动，https://docs.siliconflow.cn/cn/api-reference/embeddings/create-embeddings
  siliconflow: (options: any) => {
    return new SiliconflowEmbeddings(options);
  },
};

// 向量化类型键
export type EmbeddType = keyof typeof EmbeddModel;
