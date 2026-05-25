import { Init, Provide } from '@midwayjs/core';
import { BaseService } from '@cool-midway/core';
import { AllConfig, Config, ConfigTypeKey } from '../interface';
import { KnowConfigEntity } from '../entity/config';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';

/**
 * 配置
 */
@Provide()
export class KnowConfigService extends BaseService {
  @InjectEntityModel(KnowConfigEntity)
  knowConfigEntity: Repository<KnowConfigEntity>;

  @Init()
  async init() {
    await super.init();
    this.setEntity(this.knowConfigEntity);
  }

  /**
   * 获得配置
   * @param config 节点
   * @param type 类型
   */
  async config(config: ConfigTypeKey, type?: string) {
    return type ? Config[config][type] : Config[config];
  }

  /**
   * 所有配置
   * @returns
   */
  async all() {
    return AllConfig;
  }

  /**
   * 通过名称获取配置
   * @param func 类型
   * @param type 类型
   * @returns
   */
  async getByFunc(func: string, type?: string): Promise<KnowConfigEntity[]> {
    const find = await this.knowConfigEntity.createQueryBuilder('a');
    if (type) {
      find.where('a.type = :type', { type });
    }
    if (func) {
      find.andWhere('a.func = :func', { func });
    }
    return await find.getMany();
  }
}
