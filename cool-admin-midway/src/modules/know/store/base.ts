import { Embeddings } from '@langchain/core/embeddings';
import { VectorStore } from '@langchain/core/vectorstores';

/**
 * 数据
 */
export interface KnowVectorData {
  // ID
  id: string;
  // 数据ID
  typeId: number;
  // 内容
  content: string;
  // 类型
  type: 'rag' | 'graph';
  // 集合ID
  collectionId: string;
  // 资源ID
  sourceId: number;
}

/**
 * 存储基类
 */
export abstract class KnowStoreBase {
  // 向量化器
  embedding: Embeddings;

  set(embedding: Embeddings) {
    this.embedding = embedding;
  }

  /**
   * 获得存储器
   * @param collection
   */
  abstract getStore(collection: string): Promise<VectorStore>;

  /**
   * 操作集合
   * @param name
   * @param type
   */
  abstract collection(name: string, type: 'create' | 'delete' | 'get');

  /**
   * 更新
   * @param collection
   * @param datas
   */
  abstract upsert(collection: string, datas: KnowVectorData[]): Promise<void>;

  /**
   * 移除
   * @param collection 集合
   * @param ids id
   */
  abstract remove(collection: string, ids: string[]): Promise<void>;
}
