import { Context, Inject, Provide, Scope, ScopeEnum } from '@midwayjs/core';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { FlowInfoService } from '../service/info';
import { CoolCommException } from '@cool-midway/core';
import { z } from 'zod';
import { FlowRunService } from '../service/run';
import { FlowContext } from '../runner/context';

/**
 * MCP服务
 */
@Provide()
@Scope(ScopeEnum.Singleton, { allowDowngrade: true })
export class FlowMcpServer {
  private mcps = new Map<
    string,
    {
      transport: SSEServerTransport;
      server: McpServer;
    }
  >();

  @Inject()
  flowInfoService: FlowInfoService;

  @Inject()
  ctx: Context;

  // @Inject()
  // flowRunService: FlowRunService;

  /**
   * 获取MCP
   * @param label 标签
   * @param sessionId 会话ID
   * @param res 响应
   * @returns
   */
  async get(
    label: string,
    sessionId: string,
    res: any
  ): Promise<{
    transport: SSEServerTransport;
    server: McpServer;
  }> {
    const check = this.mcps.get(sessionId);
    if (!check) {
      const info = await this.flowInfoService.getByLabel(label);
      if (!info) {
        throw new CoolCommException('Flow not found');
      }
      const transport = new SSEServerTransport(
        `/mcp/messages/${label}/${sessionId}`,
        res
      );
      const server = new McpServer({
        name: info.name,
        version: `v_${info.version}`,
      });
      const tool = await this.getTool(label);
      server.tool(
        tool.info.label,
        tool.info.description,
        tool.schema,
        async params => {
          const context = new FlowContext();
          context.setRequestId(sessionId);
          const flowRunService = await this.ctx.requestContext.getAsync(
            FlowRunService
          );
          const result = await flowRunService.invoke(
            params,
            label,
            false,
            context
          );
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result),
              },
            ],
          };
        }
      );
      this.mcps.set(sessionId, { transport, server });
      return { transport, server };
    }
    return check;
  }

  /**
   * 移除MCP
   * @param sessionId 会话ID
   */
  async remove(sessionId: string) {
    const check = this.mcps.get(sessionId);
    if (check) {
      check.transport = null;
      check.server = null;
      this.mcps.delete(sessionId);
    }
  }

  /**
   * 处理POST消息
   * @param ctx 上下文
   * @param data 数据
   */
  async handlePostMessage(
    ctx: any,
    data: { sessionId: string; label: string; body: any }
  ) {
    const check = this.mcps.get(data.sessionId);
    if (check) {
      check.transport.handlePostMessage(ctx.req, ctx.res, data.body);
    }
  }

  /**
   * 获取工具
   * @param label 标签
   * @returns
   */
  async getTool(label: string) {
    const info = await this.flowInfoService.getByLabel(label);
    if (!info || !info.data) {
      throw new CoolCommException('流程不存在或未发布');
    }
    const graph = info.data;
    const startNode = graph.nodes.find(node => node.type === 'start');
    const inputParams: {
      field: string;
      label: string;
      type: string;
      required: boolean;
    }[] = startNode.data.inputParams;

    // 转换inputParams为zod验证模式
    const zodSchema = inputParams.reduce((acc, param) => {
      // 根据类型创建相应的zod验证器
      let validator;
      switch (param.type.toLowerCase()) {
        case 'text':
          validator = z.string().describe(param.label);
          break;
        case 'number':
          validator = z.number().describe(param.label);
          break;
        case 'image':
          validator = z.string().describe(param.label);
          break;
        default:
          validator = z.any().describe(param.label);
      }

      // 处理是否必填
      if (!param.required) {
        validator = validator.optional();
      }

      // 添加到验证模式对象
      acc[param.field] = validator;
      return acc;
    }, {});

    // 返回工具配置
    return {
      schema: zodSchema,
      info: {
        name: info.name,
        label: info.label,
        version: info.version,
        description: info.description || '',
      },
    };
  }
}
