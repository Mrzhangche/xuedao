import {
  App,
  IMidwayApplication,
  Inject,
  Provide,
  Scope,
  ScopeEnum,
} from '@midwayjs/core';
import { FlowMcpClient } from '../../mcp/client';

// MCP类型键
export type MCPTypeKey = 'sse' | 'stdio';

/**
 * MCP节点
 */
@Provide()
export class NodeMCP {
  @App()
  app: IMidwayApplication;

  /**
   * 获得模型
   * @param name
   * @returns
   */
  async getMCP(name: string) {
    const flowMcpClient = await this.app
      .getApplicationContext()
      .getAsync(FlowMcpClient);
    return flowMcpClient.getByName(name);
  }
}
