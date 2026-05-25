import { MCPTypeKey } from '.';

/**
 * 配置模板
 */
export const ConfigMCP: { [key in MCPTypeKey]?: any } = {
  // SSE
  sse: {
    url: 'sse服务地址',
  },
  // 命令行
  stdio: {
    command: '命令，如node、python、bash等',
    args: [],
  },
};
