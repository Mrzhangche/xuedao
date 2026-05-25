import { ToolTypeKey } from '.';

/**
 * 配置模板
 */
export const ConfigTOOL: { [key in ToolTypeKey]?: any } = {
  // 搜索
  search: {
    apiKey: 'API KEY',
  },
  // Tavily搜索
  // tavily: {
  //   apiKey: 'API KEY',
  //   maxResults: 10,
  // },
};
