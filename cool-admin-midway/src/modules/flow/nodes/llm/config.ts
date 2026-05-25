import { LLMModelType } from './model';

/**
 * 配置模板
 */
export const ConfigLLM: { [key in LLMModelType]?: any } = {
  // zhipu
  zhipu: {
    // 通用配置
    comm: {
      apiKey: 'api key',
    },
    // 专有配置
    options: [
      {
        field: 'model',
        title: '智谱AI',
        select: [
          'glm-4-0520',
          'glm-4',
          'glm-4-air',
          'glm-4-airx',
          'glm-4-flash',
          'glm-4-plus',
        ],
        default: 'glm-4-plus',
      },
      {
        field: 'temperature',
        type: 'number',
        title: '温度',
        default: 0.7,
        enable: true,
        max: 1,
        min: 0.1,
        supports: [],
      },
    ],
  },
  // tongyi
  tongyi: {
    // 通用配置
    comm: {
      alibabaApiKey: 'api key',
    },
    // 专有配置
    options: [
      {
        field: 'model',
        title: '通义千问',
        select: ['qwen-turbo', 'qwen-plus', 'qwen-max'],
        default: 'qwen-turbo',
      },
      {
        field: 'temperature',
        type: 'number',
        title: '温度',
        default: 0.7,
        enable: true,
        max: 1,
        min: 0.1,
        supports: [],
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
        title: 'MINIMAX',
        select: [
          'abab6.5-chat',
          'abab6.5s-chat',
          'abab5.5s-chat',
          'abab5.5-chat',
        ],
        default: 'abab6.5-chat',
      },
      {
        field: 'temperature',
        type: 'number',
        title: '温度',
        default: 0.7,
        enable: true,
        max: 1,
        min: 0.1,
        supports: [],
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
        title: 'Open AI',
        select: [
          'gpt-3.5-turbo',
          'gpt-3.5-turbo-16k',
          'gpt-4-turbo',
          'gpt-4-turbo-preview',
          'gpt-4o-mini',
        ],
        default: 'gpt-3.5-turbo',
      },
      {
        field: 'temperature',
        type: 'number',
        title: '温度',
        default: 0.7,
        enable: true,
        max: 1,
        min: 0.1,
        supports: [],
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
        title: 'Ollama 本地大模型',
        select: ['qwen2:7b', 'qwen2:72b', 'llama3:8b', 'llama3:70b'],
        default: 'qwen2:7b',
      },
      {
        field: 'temperature',
        type: 'number',
        title: '温度',
        default: 0.7,
        enable: true,
        max: 1,
        min: 0.1,
        supports: [],
      },
      {
        field: 'keepAlive',
        type: 'string',
        title: '留存',
        default: '-1s',
        enable: true,
        tips: '-1s表示永久留存，0s表示不留存，其他数字表示留存时间，单位为秒',
        supports: [],
      },
    ],
  },
  // deepseek
  deepseek: {
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
        title: 'Deepseek AI',
        select: ['deepseek-chat', 'deepseek-reasoner'],
        default: 'deepseek-chat',
      },
      {
        field: 'temperature',
        type: 'number',
        title: '温度',
        default: 0.7,
        enable: true,
        max: 1,
        min: 0.1,
        supports: [],
      },
    ],
  },
  // azure
  azure: {
    // 通用配置
    comm: {
      azureOpenAIApiKey: 'API密钥',
      azureOpenAIApiInstanceName: '实例名称',
      azureOpenAIApiDeploymentName: '部署名称',
      azureOpenAIApiVersion: 'API版本',
    },
    // 专有配置
    options: [
      {
        field: 'model',
        title: 'Azure Open AI',
        select: ['gpt-3.5-turbo-instruct'],
        default: 'gpt-3.5-turbo-instruct',
      },
      {
        field: 'temperature',
        type: 'number',
        title: '温度',
        default: 0.7,
        enable: true,
        max: 1,
        min: 0.1,
        supports: [],
      },
    ],
  },
};
