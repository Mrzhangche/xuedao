import { CoolController, BaseController } from '@cool-midway/core';
import { Body, Get, Inject, Post, Query } from '@midwayjs/core';
import { FlowConfigEntity } from '../../entity/config';
import { FlowConfigService } from '../../service/config';
import { NodeTypeKey } from '../../nodes';
import { KnowConfigService } from '../../../know/service/config';

/**
 * 节点配置
 */
@CoolController({
  api: ['add', 'delete', 'update', 'info', 'list', 'page'],
  entity: FlowConfigEntity,
  service: FlowConfigService,
  pageQueryOp: {
    keyWordLikeFields: ['a.name'],
    fieldEq: ['a.func', 'a.type', 'a.node'],
  },
  listQueryOp: {
    select: ['a.*'],
    fieldEq: ['b.type'],
  },
})
export class AdminFlowConfigController extends BaseController {
  @Inject()
  flowConfigService: FlowConfigService;

  @Inject()
  knowConfigService: KnowConfigService;

  @Get('/all', { summary: '获取所有配置' })
  async all() {
    return this.ok([
      ...(await this.flowConfigService.all()),
      ...(await this.knowConfigService.all()),
    ]);
  }

  @Post('/config', { summary: '获取节点配置' })
  async config(@Body('node') node: NodeTypeKey, @Body('type') type: string) {
    return this.ok(await this.flowConfigService.config(node, type));
  }

  @Get('/getByNode', { summary: '通过名称获取配置' })
  async getByNode(@Query('node') node: string, @Query('type') type: string) {
    const config = await this.flowConfigService.getByNode(node, type);
    return this.ok(config);
  }
}
