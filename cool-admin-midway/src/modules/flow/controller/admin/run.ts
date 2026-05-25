import { BaseController, CoolController } from '@cool-midway/core';
import { Body, ILogger, Inject, Post } from '@midwayjs/core';
import { PassThrough } from 'stream';
import { FlowRunService } from '../../service/run';
import { Context } from '@midwayjs/koa';
import { FlowContext } from '../../runner/context';
import { v4 as uuidv4 } from 'uuid';

/**
 * 流程运行
 */
@CoolController()
export class AdminFlowRunController extends BaseController {
  @Inject()
  flowRunService: FlowRunService;

  @Inject()
  ctx: Context;

  @Inject()
  logger: ILogger;

  @Post('/debug', { summary: '调试' })
  async debug(
    // 参数
    @Body('params') params: any,
    // 流程label
    @Body('label') label: string,
    // 请求ID
    @Body('requestId') requestId: string,
    // 会话ID
    @Body('sessionId') sessionId: string,
    // 节点ID
    @Body('nodeId') nodeId: string,
    // 是否流式调用
    @Body('stream') stream = false
  ) {
    // 设置响应头
    this.ctx.set('Content-Type', 'text/event-stream');
    this.ctx.set('Cache-Control', 'no-cache');
    this.ctx.set('Connection', 'keep-alive');

    const resStream = new PassThrough();
    // 上下文
    const context = new FlowContext();
    context.setRequestId(requestId || uuidv4());
    // 如果需要关联上下文，则设置会话ID
    context.setSessionId(sessionId);
    // 发送数据
    const send = (data: any) => {
      resStream.write(`data:${JSON.stringify(data)}\n\n`);
    };

    // 工具输出
    context.toolOutput = (
      name: string,
      type: 'start' | 'end',
      nodeId: string
    ) => {
      send({
        msgType: 'tool',
        data: {
          name: name,
          type: type,
          nodeId: nodeId,
        },
      });
    };

    // 流式输出
    context.streamOutput = (data: {
      isEnd: boolean;
      content: string;
      isThinking: boolean;
    }) => {
      send({
        msgType: 'llmStream',
        data,
      });
    };

    // 监听响应结束
    this.ctx.res.on('close', () => {
      context.setCancelled(true);
      resStream.end();
    });

    this.flowRunService
      .debug(params, label, stream, context, nodeId, res => {
        send(res);
      })
      .then(() => {
        this.ctx.res.end();
      })
      .catch(e => {
        this.logger.error(e);
        this.ctx.res.end();
      });
    this.ctx.status = 200;
    this.ctx.body = resStream;
  }

  @Post('/invoke', { summary: '调用' })
  async invoke(
    // 参数
    @Body('params') params: any,
    // 流程label
    @Body('label') label: string,
    // 请求ID
    @Body('requestId') requestId: string,
    // 会话ID
    @Body('sessionId') sessionId: string,
    // 是否流式调用
    @Body('stream') stream = false
  ) {
    // 上下文
    const context = new FlowContext();
    context.setRequestId(requestId || uuidv4());
    context.setSessionId(sessionId);
    if (stream) {
      // 设置响应头
      this.ctx.set('Content-Type', 'text/event-stream');
      this.ctx.set('Cache-Control', 'no-cache');
      this.ctx.set('Connection', 'keep-alive');

      const resStream = new PassThrough();

      // 发送数据
      const send = (data: any) => {
        resStream.write(`data:${JSON.stringify(data)}\n\n`);
      };

      // 工具输出
      context.toolOutput = (
        name: string,
        type: 'start' | 'end',
        nodeId: string
      ) => {
        send({
          msgType: 'tool',
          data: {
            name: name,
            type: type,
            nodeId: nodeId,
          },
        });
      };

      // 流式输出
      context.streamOutput = (data: {
        isEnd: boolean;
        content: string;
        isThinking: boolean;
        nodeId: string;
      }) => {
        send({
          msgType: 'llmStream',
          data,
        });
      };

      // 监听响应结束
      this.ctx.res.on('close', () => {
        context.setCancelled(true);
        resStream.end();
      });

      this.flowRunService
        .invoke(params, label, stream, context, res => {
          send(res);
        })
        .then(() => {
          this.ctx.res.end();
        })
        .catch(e => {
          this.logger.error(e);
          this.ctx.res.end();
        });
      this.ctx.status = 200;
      this.ctx.body = resStream;
    } else {
      return this.ok(
        await this.flowRunService.invoke(params, label, stream, context)
      );
    }
  }
}
