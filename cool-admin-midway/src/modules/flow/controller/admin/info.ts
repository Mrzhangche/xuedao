import { CoolController, BaseController } from '@cool-midway/core';
import { FlowInfoEntity } from '../../entity/info';
import { Body, Inject, Post } from '@midwayjs/core';
import { FlowInfoService } from '../../service/info';

/**
 * 流程信息
 */
@CoolController({
  api: ['add', 'delete', 'update', 'info', 'list', 'page'],
  entity: FlowInfoEntity,
  service: FlowInfoService,
  pageQueryOp: {
    keyWordLikeFields: ['a.name', 'a.label'],
    select: [
      'a.id',
      'a.name',
      'a.label',
      'a.description',
      'a.status',
      'a.data',
      'a.version',
      'a.createTime',
      'a.releaseTime',
    ],
    where: ctx => {
      const { flowId, isRelease } = ctx.request.body;

      return [
        ['a.id != :flowId', { flowId }, flowId],
        ['a.releaseTime is not null', {}, isRelease],
      ];
    },
    addOrderBy: {
      createTime: 'desc',
    },
  },
})
export class AdminFlowInfoController extends BaseController {
  @Inject()
  flowInfoService: FlowInfoService;

  @Post('/release', { summary: '发布流程' })
  async release(@Body('flowId') flowId: number) {
    return this.ok(await this.flowInfoService.release(flowId));
  }
}
