import { CoolController, BaseController } from '@cool-midway/core';
import { KnowDataSourceEntity } from '../../../entity/data/source';
import { KnowDataSourceService } from '../../../service/data/source';

/**
 * 数据源
 */
@CoolController({
  api: ['add', 'delete', 'update', 'info', 'list', 'page'],
  entity: KnowDataSourceEntity,
  service: KnowDataSourceService,
  pageQueryOp: {
    keyWordLikeFields: ['a.title'],
    fieldEq: ['a.typeId'],
  },
})
export class AdminKnowDataSourceController extends BaseController {}
