import { Config, Init, Provide } from '@midwayjs/core';
import { BaseService } from '@cool-midway/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Equal, LessThan, Repository } from 'typeorm';
import { FlowInfoEntity } from '../entity/info';
import { FlowLogEntity } from '../entity/log';
import * as _ from 'lodash';
import * as moment from 'moment';
/**
 * 流程信息日志
 */
@Provide()
export class FlowLogService extends BaseService {
  @InjectEntityModel(FlowInfoEntity)
  flowInfoEntity: Repository<FlowInfoEntity>;

  @InjectEntityModel(FlowLogEntity)
  flowLogEntity: Repository<FlowLogEntity>;

  @Config('module.flow.clear.log')
  logDayCount: number;

  @Init()
  async init() {
    await super.init();
    this.setEntity(this.flowLogEntity);
  }

  /**
   * 清理，超过n天的数据
   */
  async clear() {
    const date = moment().subtract(this.logDayCount, 'days').toDate();
    await this.flowLogEntity.delete({
      createTime: LessThan(date),
    });
  }

  /**
   * 记录日志
   * @param data
   * @returns
   */
  async save(data) {
    // 获得流程信息
    const info = await this.flowInfoEntity.findOneBy({
      label: Equal(data.flowLabel),
    });

    if (info) {
      const { inputParams, nodeInfo, result, type } = data;

      // 构建参数
      const params: {
        flowId: number;
        flowLabel: string;
        type: number;
        inputParams: any;
        result: any;
        nodeInfo?: any;
      } = {
        flowId: info.id,
        flowLabel: info.label,
        type,
        inputParams,
        result,
      };

      // 如果节点信息结果不为空
      if (!_.isEmpty(nodeInfo)) {
        // params.nodeInfo = Object.create(nodeInfoList)
        params.nodeInfo = this.extractData(nodeInfo);
      }

      // 保存日志
      return await this.flowLogEntity.save(params);
    }
  }

  /**
   * 自定义序列化函数
   * @param obj 参数
   */
  async stringifyCircular(obj) {
    const seen = new WeakSet();

    return JSON.stringify(obj, (key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return;
        }
        seen.add(value);
      }
      return value;
    });
  }

  /**
   * 提取需储存的数据
   * @param nodeInfo
   * @returns
   */
  extractData(nodeInfo) {
    const nodeInfoList =
      nodeInfo?.map(e => {
        // 结构对象，提取有用的值
        const { id, label, type, inputParams, result, config: execConfig } = e;

        const { nodesResult, ...resultArg } = result;

        const cParams = {
          id,
          label,
          type,
          inputParams,
          result: {
            ...resultArg,
          },
          config: {
            outputParams: execConfig?.outputParams || null,
            options: execConfig?.options || null,
          },
        };

        return cParams;
      }) ?? [];

    return nodeInfoList;
  }
}
