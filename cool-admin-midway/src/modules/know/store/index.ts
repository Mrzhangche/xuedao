import {
  App,
  ASYNC_CONTEXT_MANAGER_KEY,
  AsyncContextManager,
  Config,
  IMidwayApplication,
  Inject,
  Provide,
  Scope,
  ScopeEnum,
} from '@midwayjs/core';
import { KnowStoreBase } from './base';
import { KnowDataTypeService } from '../service/data/type';
// import { KnowFaissStore } from './faiss';

/**
 * 存储器类型
 */
export const StoreType = {
  // Chroma 存储， 云端存储， 需要安装 Chroma 服务
  chroma: 'knowChromaStore',
  // Faiss 存储， 本地存储， 需要安装 Faiss 服务
  // faiss: 'knowFaissStore',
  // PG 存储， 本地存储， 需要安装 PG 服务
  pg: 'knowPgStore',
} as const;

// 存储器类型键
export type StoreTypes = keyof typeof StoreType;

/**
 * 存储器
 */
@Provide()
@Scope(ScopeEnum.Singleton)
export class KnowStore {
  @Config('module.know.store')
  store: StoreTypes;

  @Config('module.know.prefix')
  prefix: string;

  stores: Map<string, KnowStoreBase> = new Map();

  @Inject()
  knowDataTypeService: KnowDataTypeService;

  @App()
  app: IMidwayApplication;

  /**
   * 获得存储器
   * @param collectionId
   */
  async get(collectionId: string): Promise<KnowStoreBase> {
    const { embedding, embeddingKey } =
      await this.knowDataTypeService.getEmbedding(collectionId);
    if (this.stores.has(embeddingKey)) {
      return this.stores.get(embeddingKey);
    }
    const store = await this.app.createAnonymousContext().requestContext.getAsync<KnowStoreBase>(StoreType[this.store]);
    store.set(embedding);
    this.stores.set(embeddingKey, store);
    return store;
  }
}
