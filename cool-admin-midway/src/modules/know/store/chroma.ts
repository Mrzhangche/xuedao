import {
  Provide,
  Scope,
  ScopeEnum,
  App,
  IMidwayApplication,
  Config,
} from '@midwayjs/core';
import { KnowStoreBase, KnowVectorData } from './base';
import { KnowDataInfoEntity } from '../entity/data/info';
import { Chroma } from '@langchain/community/vectorstores/chroma';

/**
 * 向量数据库
 */
@Provide()
export class KnowChromaStore extends KnowStoreBase {
  @App()
  app: IMidwayApplication;

  @Config('module.know.chroma')
  chromaConfig: {
    // 服务地址
    url: string;
    // 距离计算方式 可选 l2、cosine、ip
    distance: 'l2' | 'cosine' | 'ip';
  };

  /**
   *
   * @param collection
   * @returns
   */
  async getStore(collectionName: string) {
    const vectorStore = await Chroma.fromExistingCollection(this.embedding, {
      url: this.chromaConfig.url,
      collectionMetadata: {
        'hnsw:space': this.chromaConfig.distance,
      },
      collectionName,
    });
    vectorStore.index.createCollection;
    return vectorStore;
  }

  /**
   * 创建 | 删除 | 获取集合
   * @param name
   * @param type
   */
  async collection(name: string, type: 'create' | 'delete' | 'get') {
    let store = await this.getStore(name);
    if (type == 'delete') {
      await store.index.deleteCollection({ name });
    }
    return store;
  }

  /**
   * 插入 | 更新
   * @param collection
   * @param datas
   */
  async upsert(collection: string, datas: KnowVectorData[]) {
    const store = await this.getStore(collection);
    const documents = datas.map(item => {
      return {
        pageContent: item.content,
        metadata: {
          collection,
          _id: item.id,
          ...item,
        },
      };
    });
    await store.addDocuments(documents, {
      ids: documents.map(item => item.metadata._id),
    });
  }

  /**
   * 删除
   * @param collection
   * @param ids
   */
  async remove(collection: string, ids: string[]) {
    const store = await this.getStore(collection);
    await store.collection.delete({
      where: {
        _id: {
          $in: ids.map(id => id),
        },
      },
    });
  }
}
