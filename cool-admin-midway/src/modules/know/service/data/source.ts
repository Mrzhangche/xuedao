import { Init, Inject, Provide } from '@midwayjs/core';
import { BaseService, CoolCommException } from '@cool-midway/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Equal, In, Repository } from 'typeorm';
import { KnowDataSourceEntity } from '../../entity/data/source';
import { KnowDataInfoService } from './info';
import { DocumentInterface } from '@langchain/core/documents';
import { KnowGraphService } from '../graph';
import { KnowMultiLoader } from '../../loader/multi';
import * as path from 'path';
import * as os from 'os';
import { KnowLinkLoader } from '../../loader/link';
import { KnowDataInfoEntity } from '../../entity/data/info';

/**
 * 数据源
 */
@Provide()
export class KnowDataSourceService extends BaseService {
  @InjectEntityModel(KnowDataSourceEntity)
  knowDataSourceEntity: Repository<KnowDataSourceEntity>;

  @InjectEntityModel(KnowDataInfoEntity)
  knowDataInfoEntity: Repository<KnowDataInfoEntity>;

  @Inject()
  knowDataInfoService: KnowDataInfoService;

  @Inject()
  knowGraphService: KnowGraphService;

  @Inject()
  knowMultiLoader: KnowMultiLoader;

  @Inject()
  knowLinkLoader: KnowLinkLoader;

  @Init()
  async init() {
    await super.init();
    this.setEntity(this.knowDataSourceEntity);
  }

  /**
   * 删除
   * @param ids
   */
  async delete(ids: number[]) {
    await super.delete(ids);
    await this.knowDataInfoService.deleteBySourceId(ids);
    await this.knowGraphService.clearBySource(ids);
  }

  /**
   * 匹配
   * @param documents
   * @returns
   */
  async match(documents: [DocumentInterface, number][]) {
    const sourceIds = documents.map(item => item[0].metadata.sourceId);
    if (sourceIds.length == 0) {
      return [];
    }
    const sources = await this.knowDataSourceEntity.find({
      where: {
        id: In(sourceIds),
      },
    });
    for (const document of documents) {
      const item = sources.find(
        source => source.id == document[0].metadata.sourceId
      );
      delete document[0].metadata['content'];
      document[0].metadata['source'] = {
        id: item.id,
        title: item.title,
        from: item.from,
        content: item.content,
      };
    }
    return documents;
  }

  /**
   * 加载资源内容
   * @param sourceId
   * @returns
   */
  async getText(sourceId: number) {
    let text = '';
    const source = await this.knowDataSourceEntity.findOneBy({
      id: Equal(sourceId),
    });
    if (source.from == 0) {
      text = source.content;
    }
    if (source.from == 1) {
      text = await this.knowMultiLoader.loadByLink(source.content);
    }
    if (source.from == 2) {
      const docs = await this.knowLinkLoader.load(source.content, {
        downloadImages: true,
      });
      text = docs.map(item => item.pageContent)[0];
    }
    if (!text) {
      throw new CoolCommException('资源内容为空');
    }
    return { text, source };
  }

  /**
   * 修改状态
   * @param sourceId
   * @param status
   */
  async changeStatus(sourceId: number, status: number) {
    await this.knowDataSourceEntity.update(sourceId, { status });
  }

  /**
   * 检查状态
   * @param sourceId
   */
  async checkStatus(sourceId: number) {
    // 如果所有数据源都已就绪，则修改状态
    const haveNotReady = await this.knowDataInfoEntity.findOneBy({
      sourceId: Equal(sourceId),
      status: 0,
    });
    if (haveNotReady) {
      await this.changeStatus(sourceId, 0);
    } else {
      await this.changeStatus(sourceId, 1);
    }
  }
}
