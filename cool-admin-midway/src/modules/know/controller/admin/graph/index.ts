import { CoolController, BaseController } from '@cool-midway/core';
import { Body, Inject, Post } from '@midwayjs/core';
import { KnowGraphService } from '../../../service/graph';

/**
 * 知识图谱
 */
@CoolController()
export class KnowGraphController extends BaseController {
  @Inject()
  knowGraphService: KnowGraphService;

  @Post('/getGraph', { summary: '获取知识图谱' })
  async getGraph(@Body('typeId') typeId: number) {
    return this.ok(await this.knowGraphService.getGraph(typeId));
  }
}
