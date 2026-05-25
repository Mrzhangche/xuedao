import { CoolController, BaseController } from '@cool-midway/core';
import { Body, Inject, Post } from '@midwayjs/core';
import { KnowSplitterService } from '../../service/splitter';
import { Context } from '@midwayjs/koa';
import { PassThrough } from 'stream';

export interface KnowSplitterConfig {
  // 类型
  type: 'quality' | 'quick' | 'not';
  // 知识库ID
  typeId: number;
  // 资源ID
  sourceId: number;
  // 快速分段配置
  quick?: {
    // 分段最大长度
    chunkSize?: number;
    // 分段重叠长度
    chunkOverlap?: number;
    // 分段分隔符
    separator?: string;
  };
  // 高质量分段配置
  quality?: {
    // 提示词
    prompt?: string;
  };
}

/**
 * 知识拆分
 */
@CoolController()
export class AdminKnowSplitterController extends BaseController {
  @Inject()
  knowSplitterService: KnowSplitterService;

  @Inject()
  ctx: Context;

  @Post('/comm', { summary: '通用' })
  async comm(@Body('config') config: KnowSplitterConfig) {
    // 设置响应头
    this.ctx.set('Content-Type', 'text/event-stream');
    this.ctx.set('Cache-Control', 'no-cache');
    this.ctx.set('Connection', 'keep-alive');

    const resStream = new PassThrough();

    this.knowSplitterService
      .comm(config, chunk => {
        resStream.write(`data:${JSON.stringify({ chunk, isEnd: false })}\n\n`);
      })
      .then(() => {
        resStream.write(`data:${JSON.stringify({ isEnd: true })}\n\n`);
        resStream.end();
      });

    this.ctx.status = 200;
    this.ctx.body = resStream;
  }
}
