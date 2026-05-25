import { Config, Init, Provide } from '@midwayjs/core';
import { BaseService } from '@cool-midway/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Equal, LessThan, Repository } from 'typeorm';
import { FlowResultEntity } from '../entity/result';
import * as moment from 'moment';

/**
 * 流程结果
 */
@Provide()
export class FlowResultService extends BaseService {
  @InjectEntityModel(FlowResultEntity)
  flowResultEntity: Repository<FlowResultEntity>;

  @Config('module.flow.clear.result')
  resultDayCount: number;

  @Init()
  async init() {
    await super.init();
    this.setEntity(this.flowResultEntity);
  }

  /**
   * 清理，超过n天的数据
   */
  async clear() {
    const date = moment().subtract(this.resultDayCount, 'days').toDate();
    await this.flowResultEntity.delete({
      createTime: LessThan(date),
    });
  }

  /**
   * 获得结果
   * @param requestId 请求ID
   * @param nodeType 节点类型
   * @returns
   */
  async result(requestId: string, nodeType?: string) {
    const where: any = {
      requestId: Equal(requestId),
    };
    if (nodeType) {
      where.nodeType = Equal(nodeType);
    }
    return await this.flowResultEntity.findBy(where);
  }
}
