import { EmbeddType } from '.';

/**
 * 配置模板
 */
export const ConfigEmbedd: { [key in EmbeddType]?: any } = {
  // 智谱AI
  zhipu: {
    comm: {
      apiKey: 'API密钥',
    },
    options: [
      {
        field: 'model',
        title: '模型',
        select: ['embedding-3'],
        default: 'embedding-3',
      },
    ],
  },
  // doubao
  doubao: {
    comm: {
      apiKey: 'API密钥',
    },
    options: [
      {
        field: 'model',
        title: '模型',
        select: ['doubao-embedding-large-text-240915'],
        default: 'doubao-embedding-large-text-240915',
      },
    ],
  },
  // minimax
  minimax: {
    // 通用配置
    comm: {
      minimaxApiKey: 'minimax 的api key',
      minimaxGroupId: 'minimax 的group id',
    },
    // 专有配置
    options: [
      {
        field: 'model',
        title: '模型',
        select: ['embedding-2'],
        default: 'embedding-2',
      },
    ],
  },
  // tongyi
  tongyi: {
    // 通用配置
    comm: {
      apiKey: '通义千问的apiKey',
    },
    // 专有配置
    options: [
      {
        field: 'model',
        title: '模型',
        select: [
          'text-embedding-v1',
          'text-embedding-async-v1',
          'text-embedding-v2',
          'text-embedding-async-v2',
        ],
        default: 'text-embedding-v2',
      },
    ],
  },
  // openai
  openai: {
    // 通用配置
    comm: {
      apiKey: 'API密钥',
      configuration: {
        baseURL: '基础路径一般需要带/v1',
      },
    },
    // 专有配置
    options: [
      {
        field: 'model',
        title: '模型',
        select: [
          'text-davinci-003',
          'text-embedding-3-small',
          'text-embedding-3-large',
        ],
        default: 'text-embedding-3-large',
      },
    ],
  },
  // ollama
  ollama: {
    // 通用配置
    comm: {
      baseUrl: '请求地址，如：http://localhost:11434',
    },
    // 专有配置
    options: [
      {
        field: 'model',
        title: '模型',
        select: ['nomic-embed-text'],
        default: 'nomic-embed-text',
      },
    ],
  },
  // siliconflow
  siliconflow: {
    comm: {
      apiKey: 'API密钥',
    },
    // 专有配置
    options: [
      {
        field: 'model',
        title: '硅基流动模型',
        select: [
          'BAAI/bge-large-zh-v1.5',
          'BAAI/bge-large-en-v1.5',
          'netease-youdao/bce-embedding-base_v1',
          'BAAI/bge-m3',
          'Pro/BAAI/bge-m3',
        ],
        default: 'BAAI/bge-m3',
      },
    ],
  },
};
