import { Provide, Scope, ScopeEnum } from '@midwayjs/core';
import { FlowContext } from '../../runner/context';
import { FlowNode } from '../../runner/node';
import { FlowStream } from '../../runner/stream';

/**
 * 结束
 */
@Provide()
@Scope(ScopeEnum.Prototype)
export class NodeEnd extends FlowNode {
  /**
   * 执行
   * @param context
   */
  async run(context: FlowContext) {
    const { outputParams } = this.config;
    const datas = context.getData('output') as Map<string, any>;
    let result = {};
    // let stream: FlowStream;
    for (const param of outputParams) {
      result[param.field] = datas.get(
        `${this.getParamPrefix(param)}.${param.name}`
      );
      // // 如果是流，则设置流
      // if (result[param.field] instanceof FlowStream) {
      //   stream = result[param.field];
      // }
    }
    return {
      success: true,
      result,
    };
  }
}
