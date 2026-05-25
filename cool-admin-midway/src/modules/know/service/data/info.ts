import { Config, Init, Inject, Provide } from '@midwayjs/core';
import { BaseService, CoolCommException } from '@cool-midway/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Equal, In, Repository } from 'typeorm';
import { KnowDataInfoEntity } from '../../entity/data/info';
import { KnowStore } from '../../store';
import { retryWithAsync } from '@midwayjs/core';
import { KnowDataTypeEntity } from '../../entity/data/type';
import { KnowGraphService } from '../graph';
import { KnowDataSourceService } from './source';
import * as _ from 'lodash';
import { v4 as uuidv4 } from 'uuid';

/**
 * 知识信息
 */
@Provide()
export class KnowDataInfoService extends BaseService {
  @InjectEntityModel(KnowDataInfoEntity)
  knowDataInfoEntity: Repository<KnowDataInfoEntity>;

  @InjectEntityModel(KnowDataTypeEntity)
  knowDataTypeEntity: Repository<KnowDataTypeEntity>;

  @Inject()
  knowStore: KnowStore;

  @Config('module.know.prefix')
  prefix: string;

  @Config('module.know')
  knowConfig;

  @Inject()
  knowGraphService: KnowGraphService;

  @Inject()
  knowDataSourceService: KnowDataSourceService;

  @Init()
  async init() {
    await super.init();
    this.setEntity(this.knowDataInfoEntity);
  }

  /**
   * 删除
   * @param sourceId
   */
  async deleteBySourceId(sourceId: number[]) {
    const ids = await this.knowDataInfoEntity.findBy({
      sourceId: In(sourceId),
    });
    if (ids.length > 0) {
      await this.delete(ids.map(item => item.id));
    }
  }

  /**
   * 删除
   * @param ids
   */
  async delete(ids: string[]) {
    const info = await this.knowDataInfoEntity.findOneBy({ id: ids[0] });
    const type = await this.knowDataTypeEntity.findOneBy({ id: info?.typeId });
    if (!info || !type) {
      throw new CoolCommException('知识信息不存在');
    }
    const store = await this.knowStore.get(type.collectionId);
    await store.remove(`${this.prefix}${type.collectionId}`, ids);
    await super.delete(ids);
  }

  /**
   * 新增或修改
   * @param param
   * @param type
   */
  async addOrUpdate(param: any | any[], type?: 'add' | 'update') {
    if (Array.isArray(param)) {
      for (const item of param) {
        item.id = item.id || uuidv4();
      }
    } else {
      param.id = param.id || uuidv4();
    }
    await super.addOrUpdate(param, type);
    if (type == 'add') {
      // 判断param 是数组还是对象
      if (Array.isArray(param)) {
        const save = async () => {
          for (const item of param) {
            await this.retrySaveToStore(item.typeId, item);
          }
        };
        save();
      } else {
        if (param.enable == 1) {
          await this.retrySaveToStore(param.typeId, param);
        }
      }
    } else {
      const info = await this.knowDataInfoEntity.findOneBy({
        id: Array.isArray(param) ? param[0]?.id : param.id,
      });
      const type = await this.knowDataTypeEntity.findOneBy({
        id: info?.typeId || param.typeId,
      });
      if (!info || !type) {
        throw new CoolCommException('知识信息不存在');
      }
      const store = await this.knowStore.get(type.collectionId);
      const data = {
        ...info,
        ...param,
      };
      if (data.enable == 0) {
        await store.remove(`${this.prefix}${info.typeId}`, [data.id]);
        await this.knowDataInfoEntity.update(data.id, {
          status: 0,
        });
      } else {
        await this.retrySaveToStore(info.typeId, data);
      }
    }
  }

  /**
   * 重试保存到存储
   * @param typeId
   * @param param
   */
  async retrySaveToStore(typeId: number, param: KnowDataInfoEntity) {
    const invokeNew = retryWithAsync(
      this.saveToStore.bind(this),
      this.knowConfig.retry,
      {
        retryInterval: this.knowConfig.retryInterval,
      }
    );
    try {
      await invokeNew(typeId, param);
    } catch (e) {
      console.error('retrySaveToStore error', e);
    }
  }

  /**
   * 保持到存储
   * @param typeId
   * @param param
   */
  async saveToStore(typeId: number, param: KnowDataInfoEntity) {
    try {
      await this.knowDataSourceService.checkStatus(param.sourceId);
      const type = await this.knowDataTypeEntity.findOneBy({ id: typeId });
      if (!type) {
        throw new CoolCommException('知识库不存在');
      }
      const store = await this.knowStore.get(type.collectionId);
      await store.upsert(`${this.prefix}${type.collectionId}`, [
        {
          id: param.id,
          content: param.content,
          type: 'rag',
          collectionId: type.collectionId,
          sourceId: param.sourceId,
          typeId: type.id,
        },
      ]);
      await this.knowDataInfoEntity.update(
        { id: Equal(param.id) },
        {
          status: 1,
        }
      );
      await this.knowDataSourceService.checkStatus(param.sourceId);
      this.knowGraphService.retrySave(typeId, {
        typeId: type.id,
        chunkId: param.id,
        sourceId: param.sourceId,
        text: param.content,
      });
    } catch (e) {
      console.error('saveToStore error', e);
    }
  }

  /**
   * 根据ids获取内容
   * @param ids
   * @returns
   */
  async getContentByIds(ids: string[]) {
    if (_.isEmpty(ids)) {
      return [];
    }
    const infos = await this.knowDataInfoEntity.findBy({ id: In(ids) });
    return infos.map(item => {
      return {
        id: item.id,
        content: item.content,
      };
    });
  }
}
