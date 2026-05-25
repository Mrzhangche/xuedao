import { CoolController, BaseController } from '@cool-midway/core';
import { FlowResultEntity } from '../../entity/result';

/**
 * 流程结果
 */
@CoolController({
  api: ['list'],
  entity: FlowResultEntity,
  listQueryOp: {
    fieldEq: ['requestId', 'nodeType'],
  },
})
export class FlowResultController extends BaseController {}
