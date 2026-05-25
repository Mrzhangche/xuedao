import {
  WSController,
  OnWSConnection,
  OnWSDisConnection,
  Inject,
  OnWSMessage,
} from '@midwayjs/core';
import { PluginSocketTokenMiddleware } from './middleware/token';
import { Context } from '@midwayjs/socketio';
import { PluginVoiceService } from '../index';

/**
 * 声音 Socket 连接
 */
@WSController('/voice')
export class PluginVoiceSocketIoController {
  @Inject()
  ctx: Context & any;

  @Inject()
  pluginVoiceService: PluginVoiceService;

  // 客户端连接
  @OnWSConnection({ middleware: [PluginSocketTokenMiddleware] })
  async onConnectionMethod() {
    const { key, params } = this.ctx.handshake.query;
    await this.pluginVoiceService.createInstance(key, this.ctx, params);
    this.ctx.emit('sys', '连接成功');
  }

  // 客户端断开
  @OnWSDisConnection()
  async onDisConnectionMethod() {
    const { key } = this.ctx.handshake.query;
    await this.pluginVoiceService.destroyInstance(this.ctx, key);
    this.ctx.emit('sys', '断开连接');
  }

  // 发送消息
  @OnWSMessage('send', { middleware: [PluginSocketTokenMiddleware] })
  async send(params: any) {
    const { key } = this.ctx.handshake.query;
    await this.pluginVoiceService.useInstance(this.ctx, key, params);
  }

  // 结束
  @OnWSMessage('end', { middleware: [PluginSocketTokenMiddleware] })
  async end() {
    const { key } = this.ctx.handshake.query;
    await this.pluginVoiceService.endInstance(this.ctx, key);
  }

  // 停止
  @OnWSMessage('stop', { middleware: [PluginSocketTokenMiddleware] })
  async stop() {
    const { key } = this.ctx.handshake.query;
    await this.pluginVoiceService.stopInstance(this.ctx, key);
  }
}
