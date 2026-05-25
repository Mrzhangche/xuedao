import { ILogger, Inject, Provide, Scope, ScopeEnum } from '@midwayjs/core';
import { InjectDataSource } from '@midwayjs/typeorm';
import { DataSource } from 'typeorm';
import { CoolCommException, CoolEventManager } from '@cool-midway/core';
import { FlowConfigService } from '../service/config';
import { MultiServerMCPClient } from '@langchain/mcp-adapters';

/**
 * MCP客户端
 */
@Provide()
@Scope(ScopeEnum.Singleton, { allowDowngrade: true })
export class FlowMcpClient {
  @Inject()
  logger: ILogger;

  clients: Map<string, MultiServerMCPClient> = new Map();

  @InjectDataSource()
  dataSource: DataSource;

  @Inject()
  coolEventManager: CoolEventManager;

  @Inject()
  flowConfigService: FlowConfigService;

  /**
   * 初始化所有客户端
   */
  async initAll() {
    const configs = await this.flowConfigService.getByNode('mcp');
    for (const config of configs) {
      try {
        await this.initOne(config);
      } catch (error) {
        this.logger.warn(`MCP[${config.name}]不可用，请检查配置`, error);
      }
    }
  }

  /**
   * 通过名称获取客户端
   * @param name
   * @returns
   */
  async getByName(name: string): Promise<MultiServerMCPClient> {
    const client = this.clients.get(name);
    if (!client) {
      throw new CoolCommException(`MCP[${name}]不存在`);
    }
    return client;
  }

  /**
   * 初始化一个客户端
   * @param name
   */
  async initOne(config: any) {
    // 使用config.name作为服务器名，确保key一致
    const mcpServers = {
      [config.name]: {
        name: config.name,
        transport: config.type,
        type: config.type,
        ...config.options,
      },
    };
    const client = new MultiServerMCPClient(mcpServers);
    await client.initializeConnections();
    // 验证工具是否可用
    const tools = await client.getTools();
    this.logger.info(
      `MCP客户端[${config.name}]初始化成功，获取到${tools.length}个工具: ${tools
        .map(t => t.name)
        .join(', ')}`
    );
    this.clients.set(config.name, client);
  }

  /**
   * PING
   */
  async ping(config: any) {
    const mcpServers = {
      [config.name]: {
        name: config.name,
        transport: config.type,
        type: config.type,
        ...config.options,
      },
    };
    let client: MultiServerMCPClient | undefined;
    try {
      client = new MultiServerMCPClient({ mcpServers });
      // 尝试获取工具列表以验证连接
      await client.initializeConnections();
      const tools = await client.getTools(config.name);
      this.logger.info(
        `MCP[${config.name}] Ping成功，获取到${tools.length}个工具`
      );
    } catch (error) {
      this.logger.error(
        `MCP[${config.name}] Ping失败: ${error.message}`,
        error
      );
      throw new CoolCommException(`MCP[${config.name}]不可用，请检查配置`);
    } finally {
      if (client) {
        await client.close();
      }
    }
  }

  /**
   * 移除客户端
   * @param name
   */
  async remove(name: string) {
    const client = this.clients.get(name);
    try {
      await client?.close();
    } catch (error) {
      this.logger.warn(`MCP[${name}]关闭失败`, error);
    } finally {
      this.clients.delete(name);
    }
  }
}
