import { RerankType } from '.';

/**
 * 配置模板
 */
export const ConfigRerank: { [key in RerankType]?: any } = {
  // cohere
  cohere: {
    comm: {
      apiKey: 'API密钥',
    },
    options: [
      {
        field: 'model',
        title: 'Cohere',
        select: [
          'rerank-english-v3.0',
          'rerank-multilingual-v3.0',
          'rerank-english-v2.0',
          'rerank-multilingual-v2.0',
        ],
        default: 'rerank-multilingual-v3.0',
      },
    ],
  },
  // aliyun
  aliyun: {
    comm: {
      apiKey: 'API密钥',
    },
    options: [
      {
        field: 'model',
        title: '阿里云',
        select: ['gte-rerank-v2'],
        default: 'gte-rerank-v2',
      },
    ],
  },
  // siliconflow
  siliconflow: {
    comm: {
      apiKey: 'API密钥',
    },
    options: [
      {
        field: 'model',
        title: '硅基流动',
        select: [
          'BAAI/bge-reranker-v2-m3',
          'Pro/BAAI/bge-reranker-v2-m3',
          'netease-youdao/bce-reranker-base_v1',
        ],
        default: 'BAAI/bge-reranker-v2-m3',
      },
    ],
  },
};
