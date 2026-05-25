import { CoolEvent, Event } from '@cool-midway/core';
import { Inject } from '@midwayjs/core';
import { FlowMcpServer } from '../mcp/server';
import { FlowMcpClient } from '../mcp/client';

/**
 * 接收事件
 */
@CoolEvent()
export class FlowMcpEvent {
  @Inject()
  flowMcpServer: FlowMcpServer;

  @Inject()
  flowMcpClient: FlowMcpClient;

  @Event('mcp.messages')
  async messages(
    ctx: any,
    data: { sessionId: string; label: string; body: any }
  ) {
    this.flowMcpServer.handlePostMessage(ctx, data);
  }

  @Event('mcp.remove')
  async removeTool(sessionId: string) {
    this.flowMcpServer.remove(sessionId);
  }

  @Event('onServerReady')
  async onServerReady() {
    this.flowMcpClient.initAll();
  }

  @Event('mcp.client.initAll')
  async mcpClientInitAll() {
    this.flowMcpClient.initAll();
  }

  @Event('mcp.client.initOne')
  async mcpClientInitOne(config: any) {
    this.flowMcpClient.initOne(config);
  }

  @Event('mcp.client.remove')
  async mcpClientRemove(name: string) {
    this.flowMcpClient.remove(name);
  }
}
