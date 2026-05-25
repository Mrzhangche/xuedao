import { CoolController, BaseController } from '@cool-midway/core';
import { KnowDataTypeEntity } from '../../../entity/data/type';
import { KnowDataTypeService } from '../../../service/data/type';
import { Body, Inject, Post } from '@midwayjs/core';

/**
 * 知识信息类型
 */
@CoolController({
  api: ['add', 'delete', 'update', 'info', 'list', 'page'],
  entity: KnowDataTypeEntity,
  service: KnowDataTypeService,
  pageQueryOp: {
    keyWordLikeFields: ['a.name'],
  },
})
export class AdminKnowDataTypeController extends BaseController {
  @Inject()
  service: KnowDataTypeService;

  @Post('/rebuild', { summary: '重建' })
  async rebuild(@Body('typeId') typeId: number) {
    this.service.rebuild(typeId);
    return this.ok();
  }
}
