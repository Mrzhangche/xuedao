import { BaseController, CoolEventManager } from '@cool-midway/core';
import { Body, Controller, Get, Inject, Param, Post } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import { PassThrough } from 'stream';
import { v4 as uuidv4 } from 'uuid';
import { FlowMcpServer } from '../../mcp/server';

/**
 * MCP服务
 */
@Controller('/mcp')
export class OpenFlowMcpControllerController extends BaseController {
  @Inject()
  ctx: Context;

  @Inject()
  flowMcpServer: FlowMcpServer;

  @Inject()
  coolEventManager: CoolEventManager;

  @Get('/sse/:label', { summary: 'SSE连接' })
  async sse(@Param('label') label: string) {
    // 设置响应头
    this.ctx.set('Content-Type', 'text/event-stream');
    this.ctx.set('Cache-Control', 'no-cache');
    this.ctx.set('Connection', 'keep-alive');

    const resStream = new PassThrough();

    // 发送数据
    const write = (content: string) => {
      resStream.write(content);
    };
    const sessionId = uuidv4();
    const { transport, server } = await this.flowMcpServer.get(
      label,
      sessionId,
      {
        write,
        writeHead: (code: number, headers: Record<string, string>) => {
          this.ctx.res.writeHead(code, headers);
        },
        on: this.ctx.res.on,
      }
    );
    await server.connect(transport);
    // 保持连接
    const hb = setInterval(() => {
      write(`event: heartbeat\ndata: ${Date.now()}\n\n`);
    }, 10000);
    this.ctx.req.on('close', () => {
      clearInterval(hb);
      this.coolEventManager.emit('mcp.remove', sessionId);
    });

    this.ctx.status = 200;
    this.ctx.body = resStream;
  }

  @Post('/messages/:label/:sessionId', { summary: '处理消息' })
  async message(
    @Param('sessionId') sessionId: string,
    @Param('label') label: string,
    @Body() body: any
  ) {
    await this.coolEventManager.emit('mcp.messages', this.ctx, {
      sessionId,
      label,
      body,
    });
  }
}
