import { CoolController, BaseController } from '@cool-midway/core';
import { FlowLogEntity } from '../../entity/log';
import { FlowInfoEntity } from '../../entity/info';

/**
 * 流程日志
 */
@CoolController({
  api: ['delete', 'info', 'list', 'page'],
  entity: FlowLogEntity,
  pageQueryOp: {
    fieldEq: ['flowId', 'type'],
    select: ['a.*', 'b.name as "flowName"', 'b.label as "flowLabel"'],
    join: [
      {
        entity: FlowInfoEntity,
        alias: 'b',
        condition: 'a.flowId = b.id',
      },
    ],
    where: ctx => {
      const { createTime } = ctx.request.body;
      return [
        [
          'a.createTime between :startTime and :endTime',
          { startTime: createTime?.[0], endTime: createTime?.[1] },
          createTime?.[0] && createTime[1],
        ],
      ];
    },
  },
})
export class AdminFlowLogController extends BaseController {}
