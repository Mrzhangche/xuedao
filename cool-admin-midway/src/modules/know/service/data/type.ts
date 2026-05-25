import { Config, ILogger, Init, Inject, Provide } from '@midwayjs/core';
import { BaseService, CoolCommException } from '@cool-midway/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Equal, In, Repository } from 'typeorm';
import { KnowDataTypeEntity } from '../../entity/data/type';
import { KnowConfigEntity } from '../../entity/config';
import { KnowConfigService } from '../config';
import { EmbeddModel } from '../../embed';
import { KnowStore } from '../../store';
import { KnowDataInfoEntity } from '../../entity/data/info';
import { KnowDataInfoService } from './info';
import { v4 as uuidv4 } from 'uuid';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { NodeLLMModel } from '../../../flow/nodes/llm/model';
import * as md5 from 'md5';

/**
 * 知识类型
 */
@Provide()
export class KnowDataTypeService extends BaseService {
  @InjectEntityModel(KnowDataTypeEntity)
  knowDataTypeEntity: Repository<KnowDataTypeEntity>;

  @InjectEntityModel(KnowDataInfoEntity)
  knowDataInfoEntity: Repository<KnowDataInfoEntity>;

  @InjectEntityModel(KnowConfigEntity)
  knowConfigEntity: Repository<KnowConfigEntity>;

  @Inject()
  knowDataInfoService: KnowDataInfoService;

  @Inject()
  knowConfigService: KnowConfigService;

  @Config('module.know.prefix')
  prefix: string;

  @Inject()
  knowStore: KnowStore;

  @Inject()
  nodeLLMModel: NodeLLMModel;

  @Inject()
  logger: ILogger;

  @Init()
  async init() {
    await super.init();
    this.setEntity(this.knowDataTypeEntity);
  }

  /**
   * 重建
   * @param typeId
   */
  async rebuild(typeId: number) {
    const type = await this.knowDataTypeEntity.findOneBy({ id: typeId });
    if (!type) {
      throw new CoolCommException('知识库不存在');
    }
    await this.knowDataInfoEntity.update({ typeId: type.id }, { status: 0 });
    const store = await this.knowStore.get(type.collectionId);
    // 先删除
    await store.collection(`${this.prefix}${type.collectionId}`, 'delete');
    // 再创建
    await store.collection(`${this.prefix}${type.collectionId}`, 'create');
    // 获得所有数据
    const list = await this.knowDataInfoEntity.findBy({
      typeId: Equal(type.id),
      enable: 1,
    });
    // 保存到知识库
    for (const item of list) {
      await this.knowDataInfoService.retrySaveToStore(typeId, item);
    }
  }

  /**
   * 新增或修改
   * @param param
   * @param type
   */
  async addOrUpdate(param: any, type?: 'add' | 'update') {
    try {
      if (type == 'add') {
        param.collectionId = uuidv4();
      }
      if (type == 'update') {
        const old = await this.knowDataTypeEntity.findOneBy({
          id: Equal(param.id),
        });
        param.collectionId = old.collectionId;
      }
      await super.addOrUpdate(param, type);
      if (param.enable == 0) {
        return;
      }
      // 先删除
      const store = await this.knowStore.get(param.collectionId);
      await store.collection(`${this.prefix}${param.collectionId}`, 'delete');
      // 再创建
      await store.collection(`${this.prefix}${param.collectionId}`, 'create');
    } catch (err) {
      this.logger.error(err);
      if (type == 'add') {
        await this.knowDataTypeEntity.delete({ id: Equal(param.id) });
      }
      throw new CoolCommException('创建失败，可能是向量存储服务不可以用');
    }
  }

  /**
   * 删除
   * @param ids
   */
  async delete(ids: number[]) {
    const list = await this.knowDataTypeEntity.findBy({ id: In(ids) });
    for (const item of list) {
      const store = await this.knowStore.get(item.collectionId);
      await store.collection(`${this.prefix}${item.collectionId}`, 'delete');
    }
    await super.delete(ids);
    // 删除子数据
    await this.knowDataInfoEntity.delete({ typeId: In(ids) });
  }

  /**
   * 获得所有可用的知识库列表
   */
  async getKnows() {
    const list = await this.knowDataTypeEntity.findBy({
      enable: 1,
    });
    return list.map(item => {
      return {
        id: item.id,
        name: item.name,
        icon: item.icon,
        description: item.description,
      };
    });
  }

  /**
   * 获得知识信息
   * @param collectionId
   */
  async getKnow(collectionId: string) {
    const result = await this.knowDataTypeEntity.findOneBy({
      collectionId: Equal(collectionId),
    });
    return result;
  }

   /**
   * 获得知识库对应的向量化模型
   * @param collectionId
   * @returns
   */
   async getEmbedding(collectionId: string) {
    const know = await this.getKnow(collectionId);
    const embedConfigId = know.embedConfigId;
    const config = await this.knowConfigService.info(embedConfigId);
    const embedding = EmbeddModel[config.type]({
      ...config.options.comm,
      ...know.embedOptions,
    });
    return {embedding, embeddingKey: embedConfigId + md5(JSON.stringify(config))};
  }

  /**
   * 获得模型
   * @param typeId 知识库ID
   * @returns
   */
  async getLLMModel(
    typeId: number,
    providerSort: 'price' | 'latency' | 'throughput' = 'latency'
  ): Promise<BaseChatModel> {
    const know = await this.knowDataTypeEntity.findOneBy({ id: typeId });
    if (!know) {
      throw new CoolCommException('知识库不存在');
    }
    const llmOptions = know.llmOptions;
    const LLM = await this.nodeLLMModel.getModel(llmOptions.supplier);
    // 创建自定义 fetch 函数，用于在请求体中添加 provider 参数
    const customFetch = async (url: string, init?: RequestInit) => {
      if (init?.body && typeof init.body === 'string') {
        try {
          const body = JSON.parse(init.body);
          body.provider = {
            sort: providerSort,
          };
          init.body = JSON.stringify(body);
        } catch (e) {}
      }
      return fetch(url, init);
    };
    // @ts-ignore
    return new LLM({
      ...llmOptions.params,
      ...llmOptions.comm,
      configuration: {
        ...(llmOptions.comm?.configuration || {}),
        fetch: customFetch,
      },
    });
  }
}
