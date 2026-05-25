import { CoolController, BaseController } from '@cool-midway/core';
import { KnowDataInfoEntity } from '../../../entity/data/info';
import { KnowDataInfoService } from '../../../service/data/info';

/**
 * 知识信息
 */
@CoolController({
  api: ['add', 'delete', 'update', 'info', 'list', 'page'],
  entity: KnowDataInfoEntity,
  service: KnowDataInfoService,
  pageQueryOp: {
    keyWordLikeFields: ['a.title'],
    fieldEq: ['a.typeId', 'a.from', 'a.sourceId'],
  },
})
export class AdminKnowDataInfoController extends BaseController {}
