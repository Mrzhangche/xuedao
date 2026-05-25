import { Inject, Provide, Scope, ScopeEnum } from '@midwayjs/core';
import { BaseService } from '@cool-midway/core';
import { PluginService } from '../service/info';
import { Context } from '@midwayjs/socketio';

/**
 * 声音插件
 */
@Provide()
@Scope(ScopeEnum.Singleton, { allowDowngrade: true })
export class PluginVoiceService extends BaseService {
  @Inject()
  pluginService: PluginService;

  // map实例
  private map = new Map<string, any>();

  // 获取实例
  getInstance(socket: Context, key: string) {
    return this.map.get(`${socket.id}-${key}`);
  }

  /**
   * 创建实例
   * @param key 插件key
   * @returns 实例
   */
  async createInstance(key: string, socket: Context, params: any) {
    const instance: any = await this.pluginService.getInstance(key);
    let client = null;
    if (key == 'hs-tts') {
      client = await instance.stream(
        JSON.parse(params),
        chunk => {
          socket.emit('hs-tts', { isEnd: false, data: chunk });
        },
        async data => {
          socket.emit('hs-tts', { isEnd: true, data });
          // 重新创建实例
          await this.destroyInstance(socket, key);
          await this.createInstance(key, socket, params);
        }
      );

      this.map.set(`${socket.id}-${key}`, {
        client,
        socket,
        params,
      });
    }

    return {
      client,
      instance,
      socket,
      params,
    };
  }

  /**
   * 销毁实例
   * @param key 插件key
   */
  async destroyInstance(socket: Context, key: string) {
    const instance = await this.getInstance(socket, key);
    if (instance) {
      instance.client == null;
    }
    this.map.delete(`${socket.id}-${key}`);
  }

  /**
   * 使用实例
   * @param socket
   * @param key
   * @param params
   */
  async useInstance(socket: Context, key: string, params: any) {
    // 语音合成
    if (key == 'hs-tts') {
      const instance = await this.getInstance(socket, key);

      if (instance) {
        instance.client.sendText(params.text);
      }
    }
    // 语音识别
    if (key == 'hs-asr') {
      let instance = await this.getInstance(socket, key);
      if (!instance) {
        const plugin: any = await this.pluginService.getInstance(key);
        const client = await plugin.stream(params, {
          onInterim(text) {
            console.log(text);
            socket.emit('hs-asr', { isEnd: false, data: text });
          },
          onFinal: async text => {
            socket.emit('hs-asr', { isEnd: true, data: text });
            await this.destroyInstance(socket, key);
          },
          onReady() {
            socket.emit('hs-asr', { event: 'ready' });
          },
          onError(err) {
            console.log(err);
          },
        });
        instance = {
          client,
          socket,
          params,
          instance: plugin,
        };
        this.map.set(`${socket.id}-${key}`, {
          client,
          socket,
          params,
        });
      }

      if (params.buffer) {
        await instance.client.send(params.buffer);
      }
    }
  }

  /**
   * 结束实例
   * @param socket
   * @param key
   */
  async endInstance(socket: Context, key: string) {
    const instance = await this.getInstance(socket, key);
    if (instance) {
      if (key == 'hs-tts') {
        instance.client.end();
      }
      if (key == 'hs-asr') {
        instance.client.done();
      }
    }
  }

  /**
   * 停止实例
   * @param socket
   * @param key
   */
  async stopInstance(socket: Context, key: string) {
    const instance = await this.getInstance(socket, key);
    // 重新创建实例
    if (instance) {
      await instance.client.endConnection();
    }
    await this.destroyInstance(socket, key);
  }
}
