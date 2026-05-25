import * as _ from 'lodash';
import { FlowContext } from './context';
import { FlowResult } from './result';
import { ILogger, Inject, Provide } from '@midwayjs/core';
import { InjectDataSource } from '@midwayjs/typeorm';
import { DataSource } from 'typeorm';
import { FlowResultEntity } from '../entity/result';
import * as moment from 'moment';

/**
 * 节点配置
 */
export interface NodeConfig {
  // 输入参数
  inputParams: {
    /** 节点ID */
    nodeId: string;
    /** 参数名 */
    name: string;
    /** 类型(哪个节点) */
    nodeType: string;
    /** 字段 */
    field?: string;
    /** 值类型 */
    type: string;
    /** 是否必填 */
    required: boolean;
    /** 默认值 */
    default: any;
    /** 参数值 */
    value: any;
  }[];
  // 输出参数
  outputParams: {
    /** 节点ID */
    nodeId: string;
    /** 参数名 */
    name: string;
    /** 字段 */
    field?: string;
    /** 字段类型 */
    type: string;
    /** 类型(哪个节点) */
    nodeType: string;
  }[];
  // 配置
  options: Record<string, any>;
}

/**
 * 节点
 */
@Provide()
export abstract class FlowNode {
  @InjectDataSource()
  dataSource: DataSource;

  @Inject()
  logger: ILogger;

  /** 节点id */
  id: string;
  /** 流程id */
  flowId: number;
  /** 节点label */
  label: string;
  /** 节点类型 */
  type: string;
  /** 节点描述 */
  desc: string;
  /** 节点配置 */
  config: NodeConfig;
  /** 输入参数 */
  inputParams: any;
  /** 图片参数 */
  imageParams: any;
  /** 文件参数 */
  fileParams: any;
  /** 上下文 */
  context: FlowContext;
  /**
   * 调用
   * @param config
   */
  async invoke(context: FlowContext): Promise<FlowResult> {
    let result: FlowResult;
    const startTime = moment();
    try {
      this.context = context;
      this.inputParams = this.getInputParams(context);
      result = await this.run(context);
    } catch (e) {
      this.logger.error(e);
      result = { success: false, error: e.message };
    }
    const endTime = moment();
    const duration = endTime.diff(startTime, 'milliseconds');
    const flowResultEntity = this.dataSource.getRepository(FlowResultEntity);
    await flowResultEntity.save({
      requestId: context.getRequestId(),
      node: {
        id: this.id,
        type: this.type,
        label: this.label,
        desc: this.desc,
      },
      nodeType: this.type,
      input: this.inputParams,
      output: result,
      duration,
    });
    context.setNodeRunInfo(this.id, {
      duration,
      success: result.success,
      result,
    });
    if (this.type == 'end') {
      context.setFlowResult(result);
    }
    return result;
  }
  /**
   * 获得前缀
   * @returns
   */
  getPrefix() {
    return `${this.type}.${this.id}`;
  }

  /**
   * 获得参数前缀
   * @param param
   * @returns
   */
  getParamPrefix(param: { nodeId: string; nodeType: string }) {
    return `${param.nodeType}.${param.nodeId}`;
  }

  /**
   * 获取输入参数
   * @param context
   */
  protected getInputParams(context: FlowContext) {
    if (context.isDebugOne() || this.type == 'start') {
      return context.getRequestParams();
    }
    const { inputParams } = this.config;
    // 如果是开始节点，参数从请求中获取 context.getRequestParams() 转换为 Map<string, any>
    let datas = context.getData('output') as Map<string, any>;
    let params = {};
    let imageParams = {};
    let fileParams = {};
    if (_.isEmpty(inputParams)) {
      return params;
    }
    for (const param of inputParams) {
      if (param.field) {
        if (param.type == 'text') {
          params[param.field] = datas.get(
            `${this.getParamPrefix(param)}.${param.name}`
          );
        }
        if (param.type == 'image') {
          const value = datas.get(
            `${this.getParamPrefix(param)}.${param.name}`
          );
          if (value) {
            imageParams[param.field] = value;
          }
        } else if (param.type == 'file') {
          const value = datas.get(
            `${this.getParamPrefix(param)}.${param.name}`
          );
          if (value) {
            fileParams[param.field] = value;
          }
        } else {
          params[param.field] = datas.get(
            `${this.getParamPrefix(param)}.${param.name}`
          );
        }
      }
    }
    this.inputParams = params;
    this.imageParams = imageParams;
    this.fileParams = fileParams;
    return params;
  }

  /**
   * 执行
   * @param context
   */
  abstract run(context: FlowContext): Promise<FlowResult>;
}
