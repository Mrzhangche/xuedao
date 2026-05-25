import { CoolController, BaseController } from '@cool-midway/core';
import { Body, Get, Inject, Post, Query } from '@midwayjs/core';
import { KnowConfigService } from '../../service/config';
import { ConfigTypeKey } from '../../interface';
import { KnowConfigEntity } from '../../entity/config';
import { FlowConfigService } from '../../../flow/service/config';

/**
 * 配置
 */
@CoolController({
  api: ['add', 'delete', 'update', 'info', 'list', 'page'],
  entity: KnowConfigEntity,
  service: KnowConfigService,
  pageQueryOp: {
    select: ['a.*'],
    keyWordLikeFields: ['a.name'],
    fieldEq: ['a.func', 'a.type'],
  },
  listQueryOp: {
    select: ['a.*'],
    fieldEq: ['b.type'],
  },
})
export class AdminKnowConfigController extends BaseController {
  @Inject()
  knowConfigService: KnowConfigService;

  @Inject()
  flowConfigService: FlowConfigService;

  @Get('/all', { summary: '获取所有配置' })
  async all() {
    return this.ok([
      ...(await this.flowConfigService.all()),
      ...(await this.knowConfigService.all()),
    ]);
  }

  @Post('/config', { summary: '获取配置' })
  async config(@Body('func') func: ConfigTypeKey, @Body('type') type: string) {
    return this.ok(await this.knowConfigService.config(func, type));
  }

  @Get('/getByFunc', { summary: '通过功能获取配置' })
  async getByNode(@Query('func') func: string, @Query('type') type: string) {
    const config = await this.knowConfigService.getByFunc(func, type);
    return this.ok(config);
  }
}
