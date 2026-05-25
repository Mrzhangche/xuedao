import { Inject, Provide, Scope, ScopeEnum } from '@midwayjs/core';
import { FlowNode } from '../../runner/node';
import { FlowContext } from '../../runner/context';
import { FlowResult } from '../../runner/result';
import { FlowConfigService } from '../../service/config';
import { FlowRunService } from '../../service/run';
import { FlowInfoEntity } from '../../entity/info';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Equal, Repository } from 'typeorm';

/**
 * 流程
 */
@Provide()
@Scope(ScopeEnum.Prototype)
export class NodeFlow extends FlowNode {
  @InjectEntityModel(FlowInfoEntity)
  flowInfoEntity: Repository<FlowInfoEntity>;

  @Inject()
  flowConfigService: FlowConfigService;

  @Inject()
  flowRunService: FlowRunService;

  /**
   * 执行
   * @param context
   */
  async run(context: FlowContext): Promise<FlowResult> {
    const { outputParams, options } = this.config;

    // 获得输入参数
    const params = this.inputParams;

    // 获取流程label
    const flowInfo = await this.flowInfoEntity.findOneBy({
      id: Equal(options.flowId),
    });

    if (!flowInfo) {
      throw new Error('流程不存在');
    }

    const flowContext = new FlowContext();
    flowContext.setRequestId('xxxxx');
    flowContext.setDebug(false);
    flowContext.setInternal(true);
    // 执行流程
    const { result } = await this.flowRunService.invoke(
      params,
      flowInfo.label,
      false,
      flowContext
    );

    for (const param of outputParams) {
      context.set(
        `${this.getPrefix()}.${param.field}`,
        result[param.field],
        'output'
      );
    }

    return {
      success: true,
      result: result || {},
    };
  }
}
