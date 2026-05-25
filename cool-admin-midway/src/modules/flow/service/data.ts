import { BaseService } from '@cool-midway/core';
import { Init, Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Equal, Repository } from 'typeorm';
import { FlowDataEntity } from '../entity/data';
import { FlowInfoEntity } from '../entity/info';

/**
 * 流程数据
 */
@Provide()
export class FlowDataService extends BaseService {
  @InjectEntityModel(FlowDataEntity)
  flowDataEntity: Repository<FlowDataEntity>;

  @InjectEntityModel(FlowInfoEntity)
  flowInfoEntity: Repository<FlowInfoEntity>;

  @Init()
  async init() {
    await super.init();
    this.setEntity(this.flowDataEntity);
  }

  /**
   * 设置数据
   * @param flowId
   * @param objectId
   * @param data
   */
  async set(flowId: number, objectId: string, data: any) {
    const check = await this.flowDataEntity.findOneBy({
      flowId: Equal(flowId),
      objectId: Equal(objectId),
    });
    if (check) {
      await this.flowDataEntity.update(check.id, { data });
    } else {
      await this.flowDataEntity.save({ flowId, objectId, data });
    }
  }

  /**
   * 获取数据
   * @param flowId
   * @param objectId
   */
  async get(flowId: number, objectId: string) {
    const data = await this.flowDataEntity.findOneBy({
      flowId: Equal(flowId),
      objectId: Equal(objectId),
    });
    return data?.data;
  }

  /**
   * 获取数据
   * @param flowId
   * @param objectId
   */
  async getByLabel(label: string, objectId: string) {
    const flow = await this.flowInfoEntity.findOneBy({
      label: Equal(label),
    });
    if (!flow) {
      return null;
    }
    const data = await this.flowDataEntity.findOneBy({
      flowId: Equal(flow.id),
      objectId: Equal(objectId),
    });
    return data?.data;
  }
}
