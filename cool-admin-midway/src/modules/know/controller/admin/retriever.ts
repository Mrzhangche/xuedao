import { CoolController, BaseController } from '@cool-midway/core';
import { Body, Inject, Post } from '@midwayjs/core';
import { KnowRetrieverService } from '../../service/retriever';
import { SearchOptions } from '../../interface';

/**
 * 检索器
 */
@CoolController()
export class AdminKnowRetrieverController extends BaseController {
  @Inject()
  knowRetrieverService: KnowRetrieverService;

  @Post('/invoke', { summary: '调用' })
  async invoke(
    @Body('knowId') knowId: number,
    @Body('text') text: string,
    @Body('options') options: SearchOptions
  ) {
    const result = await this.knowRetrieverService.invoke(
      knowId,
      text,
      options
    );
    return this.ok(result);
  }
}
