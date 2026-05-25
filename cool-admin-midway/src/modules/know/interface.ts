import { ConfigEmbedd } from './embed/config';
import { ConfigRerank } from './rerank/config';

/**
 * 搜索配置
 */
export interface SearchOptions {
  /** 结果条数 */
  size: number;
  /** 分值过滤 */
  minScore?: number;
  /** 是否使用图谱搜索 */
  useGraph?: boolean;
  /** 图谱搜索层级 */
  graphLevel?: number;
  /** 图谱搜索数量 */
  graphSize?: number;
  /** 历史消息 */
  history?: any[];
}

// 配置
export const Config = {
  // 向量化模型
  embed: ConfigEmbedd,
  // 重排模型
  rerank: ConfigRerank,
};

// 节点类型键
export type ConfigTypeKey = keyof typeof Config;

/**
 * 所有配置
 */
export const AllConfig = [
  {
    title: '向量化模型Embed',
    type: 'embed',
  },
  {
    title: '重排模型Rerank',
    type: 'rerank',
  },
];
