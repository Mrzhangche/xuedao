import { ModuleConfig } from '@cool-midway/core';
import { StoreTypes } from './store';
import { pDataPath } from '../../comm/path';
import { join } from 'path';
import { DistanceStrategy } from '@langchain/community/vectorstores/pgvector';

/**
 * 模块配置
 */
export default () => {
  return {
    // 模块名称
    name: '知识库',
    // 模块描述
    description: '知识库，检索，向量存储等',
    // 中间件，只对本模块有效
    middlewares: [],
    // 中间件，全局有效
    globalMiddlewares: [],
    // 模块加载顺序，默认为0，值越大越优先加载
    order: 0,
    // 向量数据存储，默认为：faiss
    store: 'pg' as StoreTypes,
    // chroma 配置
    chroma: {
      // 服务地址
      url: 'http://127.0.0.1:8000',
      // 距离计算方式 可选 l2、cosine、ip
      distance: 'l2',
      // 重试次数，向量化失败时重试
      retry: 10,
      // 重试间隔，单位：ms
      retryInterval: 1000,
    },
    faiss: {
      directory: join(pDataPath(), 'faiss'),
    },
    // PG 配置
    pg: {
      // 距离计算方式
      distanceStrategy: 'cosine' as DistanceStrategy,
      // 表名
      tableName: 'know_pg_store',
    },
    // 集合前缀
    prefix: '',
    // 重试次数，向量化失败时重试
    retry: 3,
    // 重试间隔，单位：ms
    retryInterval: 1000,
    // 索引数量，非返回数量
    indexCount: 60,
    // splitter
    splitter: {
      // 最大token数
      maxTokens: 10000,
      // 重叠token数
      overlapTokens: 500,
    },
  } as ModuleConfig;
};
