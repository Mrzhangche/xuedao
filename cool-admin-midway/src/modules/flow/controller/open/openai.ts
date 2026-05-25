import {
  BaseController,
  CoolCommException,
  CoolController,
  CoolTag,
  CoolUrlTag,
  TagTypes,
} from '@cool-midway/core';
import { Body, ILogger, Inject, Post } from '@midwayjs/core';
import { PassThrough } from 'stream';
import { FlowRunService } from '../../service/run';
import { Context } from '@midwayjs/koa';
import { FlowContext } from '../../runner/context';
import { v4 as uuidv4 } from 'uuid';

/**
 * OpenAI协议兼容接口
 */
@CoolUrlTag()
@CoolController()
export class OpenFlowOpenAIController extends BaseController {
  @Inject()
  flowRunService: FlowRunService;

  @Inject()
  ctx: Context;

  @Inject()
  logger: ILogger;

  /**
   * 兼容OpenAI的聊天补全接口
   */
  @CoolTag(TagTypes.IGNORE_TOKEN)
  @Post('/v1/chat/completions', { summary: 'OpenAI兼容接口' })
  async chatCompletions(@Body() body: any) {
    const {
      model,
      messages,
      stream = false,
      temperature,
      max_tokens,
      top_p,
      frequency_penalty,
      presence_penalty,
      stop,
      user,
    } = body;

    // 将model映射为label
    const label = model;
    
    // 生成请求ID
    const requestId = uuidv4();
    const chatId = `chatcmpl-${requestId}`;

    // 构建上下文
    const context = new FlowContext();
    context.setRequestId(requestId);

    // 从messages中提取最后一个用户问题作为content
    let content = '';
    const userMessages = messages?.filter(msg => msg.role === 'user') || [];
    if (userMessages.length > 0) {
      const lastUserMsg = userMessages[userMessages.length - 1];
      content = typeof lastUserMsg.content === 'string' 
        ? lastUserMsg.content 
        : JSON.stringify(lastUserMsg.content);
    }

    // 提取system类型的消息作为prompt
    let prompt = '';
    const systemMessages = messages?.filter(msg => msg.role === 'system') || [];
    if (systemMessages.length > 0) {
      // 如果有多个system消息，合并它们
      prompt = systemMessages
        .map(msg => typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content))
        .join('\n');
    }

    // 去除最后一个用户消息和system消息的其他消息
    const otherMessages = messages?.filter((msg, index) => {
      // 排除system消息
      if (msg.role === 'system') return false;
      // 排除最后一个用户消息
      if (msg.role === 'user') {
        const userMsgIndex = userMessages.findIndex(um => um === msg);
        if (userMsgIndex === userMessages.length - 1) {
          return false;
        }
      }
      return true;
    }) || [];

    // 将messages转换为params
    const params = {
      content, // 最后一个用户问题
      prompt, // system类型的消息
      messages: JSON.stringify(otherMessages), // 去除最后一个用户消息和system消息的其他消息
      temperature,
      max_tokens,
      top_p,
      frequency_penalty,
      presence_penalty,
      stop,
      user,
    };

    // 流式响应
    if (stream) {
      this.ctx.set('Content-Type', 'text/event-stream');
      this.ctx.set('Cache-Control', 'no-cache');
      this.ctx.set('Connection', 'keep-alive');

      const resStream = new PassThrough();
      let contentBuffer = '';

      // 流式输出处理
      context.streamOutput = (data: {
        isEnd: boolean;
        content: string;
        isThinking: boolean;
        nodeId: string;
      }) => {
        const { isEnd, content, isThinking } = data;

        // 跳过思考过程
        if (isThinking) {
          return;
        }

        // 构建OpenAI流式响应格式
        const chunk = {
          id: chatId,
          object: 'chat.completion.chunk',
          created: Math.floor(Date.now() / 1000),
          model: label,
          choices: [
            {
              index: 0,
              delta: isEnd ? {} : { content },
              finish_reason: isEnd ? 'stop' : null,
            },
          ],
        };

        resStream.write(`data: ${JSON.stringify(chunk)}\n\n`);

        if (!isEnd) {
          contentBuffer += content;
        }

        if (isEnd) {
          resStream.write('data: [DONE]\n\n');
        }
      };

      // 监听响应结束
      this.ctx.res.on('close', () => {
        context.setCancelled(true);
        resStream.end();
      });

      this.flowRunService
        .invoke(params, label, stream, context, res => {
          // 处理其他类型的响应
          if (res.msgType === 'result') {
            // 如果有结果但没有流式输出过内容，发送完整结果
            if (!contentBuffer && res.data?.output) {
              const chunk = {
                id: chatId,
                object: 'chat.completion.chunk',
                created: Math.floor(Date.now() / 1000),
                model: label,
                choices: [
                  {
                    index: 0,
                    delta: { content: res.data.output },
                    finish_reason: null,
                  },
                ],
              };
              resStream.write(`data: ${JSON.stringify(chunk)}\n\n`);
            }
            // 发送结束标记
            const endChunk = {
              id: chatId,
              object: 'chat.completion.chunk',
              created: Math.floor(Date.now() / 1000),
              model: label,
              choices: [
                {
                  index: 0,
                  delta: {},
                  finish_reason: 'stop',
                },
              ],
            };
            resStream.write(`data: ${JSON.stringify(endChunk)}\n\n`);
            resStream.write('data: [DONE]\n\n');
          }
        })
        .then(() => {
          this.ctx.res.end();
        })
        .catch(e => {
          this.logger.error('OpenAI兼容接口错误:', e);
          // 发送错误信息
          const errorChunk = {
            id: chatId,
            object: 'chat.completion.chunk',
            created: Math.floor(Date.now() / 1000),
            model: label,
            choices: [
              {
                index: 0,
                delta: { content: `错误: ${e.message}` },
                finish_reason: 'error',
              },
            ],
          };
          resStream.write(`data: ${JSON.stringify(errorChunk)}\n\n`);
          resStream.write('data: [DONE]\n\n');
          this.ctx.res.end();
        });

      this.ctx.status = 200;
      this.ctx.body = resStream;
    } else {
      // 非流式响应
      try {
        const result = await this.flowRunService.invoke(
          params,
          label,
          stream,
          context
        );

        // 提取输出内容
        let content = result.result.content;

        if (!content) {
            throw new CoolCommException('无输出内容，注意流程结束节点需要将输出参数设置为：content');
        }

        // 构建OpenAI响应格式
        const response = {
          id: chatId,
          object: 'chat.completion',
          created: Math.floor(Date.now() / 1000),
          model: label,
          choices: [
            {
              index: 0,
              message: {
                role: 'assistant',
                content: content,
              },
              finish_reason: 'stop',
            },
          ],
          usage: {
            prompt_tokens: 0,
            completion_tokens: 0,
            total_tokens: 0,
          },
        };

        this.ctx.body = response;
      } catch (e) {
        this.logger.error('OpenAI兼容接口错误:', e);
        this.ctx.status = 500;
        this.ctx.body = {
          error: {
            message: e.message,
            type: 'server_error',
            code: 'internal_error',
          },
        };
      }
    }
  }
}

