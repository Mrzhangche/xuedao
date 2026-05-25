import { Config, Provide, Scope, ScopeEnum } from '@midwayjs/core';
import { KnowStoreBase, KnowVectorData } from './base';
import { VectorStore } from '@langchain/core/vectorstores';
import { KnowDataInfoEntity } from '../entity/data/info';
import { Document } from '@langchain/core/documents';
import {
  PGVectorStore,
  DistanceStrategy,
} from '@langchain/community/vectorstores/pgvector';
import { CoolCommException } from '@cool-midway/core';
import { PoolConfig } from 'pg';

/**
 * PG向量数据库
 */
@Provide()
export class KnowPgStore extends KnowStoreBase {
  store: PGVectorStore;

  @Config('typeorm.dataSource.default')
  connConfig: {
    type: string;
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
  };

  @Config('module.know.pg')
  pgConfig: {
    distanceStrategy: DistanceStrategy;
    tableName: string;
  };

  /**
   * 获取存储器
   * @param collection 集合名称
   * @returns VectorStore实例
   */
  async getStore(collection: string): Promise<VectorStore> {
    await this.collection(collection, 'get');
    return this.store;
  }

  /**
   * 操作集合
   * @param name 集合名称
   * @param type 操作类型
   */
  async collection(name: string, type: 'create' | 'delete' | 'get') {
    if (type == 'get' || 'create') {
      if (this.connConfig.type != 'postgres') {
        throw new CoolCommException('PG向量数据库只支持postgres数据库');
      }
      if (this.store) {
        return this.store;
      }
      const config = {
        postgresConnectionOptions: {
          type: this.connConfig.type,
          host: this.connConfig.host,
          port: this.connConfig.port,
          user: this.connConfig.username,
          password: this.connConfig.password,
          database: this.connConfig.database,
        } as PoolConfig,
        tableName: 'know_pg_store',
        columns: {
          idColumnName: 'id',
          vectorColumnName: 'vector',
          contentColumnName: 'content',
          metadataColumnName: 'metadata',
        },
        ...this.pgConfig,
      };
      this.store = await PGVectorStore.initialize(this.embedding, config);
      return this.store;
    }
    if (type == 'delete') {
      await this.store.delete({
        filter: {
          collection: name,
        },
      });
    }
  }

  /**
   * 更新
   * @param collection 集合名称
   * @param datas 数据
   */
  async upsert(collection: string, datas: KnowVectorData[]): Promise<void> {
    // 先删除已存在的文档
    const existingIds = datas.filter(item => item.id).map(item => item.id);
    if (existingIds.length > 0) {
      await this.remove(collection, existingIds);
    }

    // 准备新文档
    const documents = datas.map(
      item =>
        new Document({
          pageContent: item.content,
          metadata: {
            _id: item.id,
            ...item,
            collection,
          },
        })
    );

    // 添加新文档
    await this.store.addDocuments(documents, {
      ids: documents.map(item => item.metadata._id),
    });
  }

  /**
   * 删除
   * @param collection 集合名称
   * @param ids 数据ID
   */
  async remove(collection: string, ids: string[]): Promise<void> {
    const store = await this.getStore(collection);
    await store.delete({
      ids: ids,
    });
  }
}
