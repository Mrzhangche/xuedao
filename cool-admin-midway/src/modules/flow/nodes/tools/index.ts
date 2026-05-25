import { Provide } from '@midwayjs/core';
import { ZhipuSearch } from './search';
// import { TavilySearchResults } from '@langchain/community/tools/tavily_search';

/**
 * 工具
 */
export const tools = {
  // 智谱，https://open.bigmodel.cn/dev/api/search-tool/web-search-pro
  search: (options: any) => {
    return new ZhipuSearch(options);
  },
  // Tavily搜索，https://tavily.com/
  // tavily: (options: any) => {
  //   return new TavilySearchResults(options);
  // },
};

// 工具类型键
export type ToolTypeKey = keyof typeof tools;

/**
 * LLM大模型节点
 */
@Provide()
export class NodeTool {
  /**
   * 获得模型
   * @param name
   * @returns
   */
  async getTool(name: string): Promise<ZhipuSearch> {
    return tools[name];
  }
}
