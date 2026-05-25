import { CoolController, BaseController } from '@cool-midway/core';
import { Body, Inject, Post } from '@midwayjs/core';
import { KnowLoaderService } from '../../service/loader';
import { Context } from '@midwayjs/koa';
import { PassThrough } from 'stream';

/**
 * 知识库加载器
 */
@CoolController()
export class AdminKnowLoaderController extends BaseController {
  @Inject()
  knowLoaderService: KnowLoaderService;

  @Inject()
  ctx: Context;

  @Post('/fileByLink', { summary: '通过文件链接加载' })
  async fileByLink(@Body('link') link: string) {
    return this.ok(await this.knowLoaderService.loadFileByLink(link));
  }

  @Post('/link', { summary: '加载链接' })
  async link(@Body('link') link: string) {
    return this.ok(await this.knowLoaderService.loadLink(link));
  }

  @Post('/parseUrl', { summary: '解析链接' })
  async parseUrl(@Body('link') link: string) {
    // 设置响应头
    this.ctx.set('Content-Type', 'text/event-stream');
    this.ctx.set('Cache-Control', 'no-cache');
    this.ctx.set('Connection', 'keep-alive');

    const resStream = new PassThrough();

    this.knowLoaderService
      .parseUrl(link, result => {
        resStream.write(
          `data:${JSON.stringify({ ...result, isEnd: false })}\n\n`
        );
      })
      .then(() => {
        resStream.write(`data:${JSON.stringify({ isEnd: true })}\n\n`);
        resStream.end();
      });
    this.ctx.status = 200;
    this.ctx.body = resStream;
  }
}
