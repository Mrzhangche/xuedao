import { Provide, Scope, ScopeEnum } from '@midwayjs/core';
import { FlowNode } from '../../runner/node';
import { FlowContext } from '../../runner/context';
import { CoolCommException } from '@cool-midway/core';
import * as _ from 'lodash';

/**
 * 开始节点
 */
@Provide()
@Scope(ScopeEnum.Prototype)
export class NodeStart extends FlowNode {
  /**
   * 执行
   * @param context
   */
  async run(context: FlowContext) {
    const { inputParams } = this.config;
    // 获得请求参数(带值的)
    const requestParams = context.getRequestParams();
    const reuslt = {};
    // 校验并设置输出参数
    for (const param of inputParams) {
      let value = requestParams[param.name];
      if (param.required && this.isEmptyValue(value)) {
        throw new CoolCommException(`参数 ${param.name} 为必填`);
      }
      const checkType = this.checkType(value, param.type);
      if (value !== undefined && !checkType) {
        throw new CoolCommException(`参数 ${param.name} 类型错误`);
      } else {
        value = this.transformValue(value, param.type);
      }
      reuslt[param.field] = value;
      context.set(`${this.getPrefix()}.${param.name}`, value, 'output');
    }
    return {
      success: true,
      result: reuslt,
    };
  }

  /**
   * 判断是否为空值
   * @param value
   * @returns
   */
  isEmptyValue(value) {
    // 检查是否是 null 或 undefined
    if (_.isNil(value)) {
      return true;
    }

    // 特别对待非容器类型（如数字和布尔值）
    if (_.isNumber(value) || _.isBoolean(value)) {
      return false;
    }

    // 对字符串、数组、对象使用 _.isEmpty
    return _.isEmpty(value);
  }

  /**
   * 转换值
   * @param value
   * @param type
   */
  transformValue(value: any, type: string) {
    if (type == 'number') {
      return Number(value);
    }
    return value;
  }

  /**
   * 字段类型
   * @param value
   * @returns
   */
  checkType(value: any, type: string) {
    if (type == 'image') {
      return (
        Array.isArray(value) &&
        value.every(e => typeof e === 'string' && e.startsWith('http'))
      );
    }
    if (type == 'file') {
      return (
        Array.isArray(value) &&
        value.every(e => typeof e === 'string' && e.startsWith('http'))
      );
    }
    if (type == 'text') {
      return typeof value === 'string';
    }
    if (type == 'number') {
      return !isNaN(value);
    }
    return true;
  }
}
