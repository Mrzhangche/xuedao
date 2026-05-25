import { CallbackManagerForToolRun } from '@langchain/core/callbacks/manager';
import { Tool, ToolParams } from '@langchain/core/tools';
import axios from 'axios';
import * as _ from 'lodash';
import { z } from 'zod';

/**
 * 配置参数
 */
export type Fields = ToolParams & {
  /**
   * 搜索API密钥
   */
  apiKey: string;
};

/**
 * 智谱搜索
 */
export class ZhipuSearch extends Tool {
  static lc_name() {
    return '智谱联网搜索';
  }
  name: string = 'zhipu_search';
  description =
    'A search engine optimized for comprehensive, accurate,read url content, and trusted results. Useful for when you need to answer questions about current events、network info. Input should be a search query.';

  schema = z
    .object({ input: z.string().optional() })
    .describe('search keyword')
    .transform(obj => obj.input) as any;

  protected apiKey?: string;

  constructor(fields) {
    super(fields);
    this.apiKey = fields.apiKey;

    if (this.apiKey === undefined) {
      throw new Error(
        `No Zhipu API key found. Either set an environment variable named "ZHIPU_API_KEY" or pass an API key as "apiKey".`
      );
    }
  }

  protected async _call(
    input: string,
    runManager?: CallbackManagerForToolRun
  ): Promise<string> {
    const url = 'https://open.bigmodel.cn/api/paas/v4/tools';

    const data = {
      tool: 'web-search-pro',
      stream: false,
      messages: [
        {
          role: 'user',
          content: input,
        },
      ],
    };

    try {
      const response = await axios.post(url, data, {
        headers: {
          Authorization: this.apiKey,
        },
        timeout: 300000, // 300秒
      });
      const results: any[] = response.data.choices[0].message.tool_calls;
      const searchResult = _.find(results, { type: 'search_result' });
      if (searchResult?.search_result) {
        const contents = searchResult?.search_result;
        const res = [];
        for (const content of contents) {
          res.push(
            `title: ${content.title} \n content: ${content.content} \n link: ${content.link} \n media: ${content.media}`
          );
        }
        return res.map((item, index) => `${index + 1}. ${item}`).join('\n');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`智谱搜索API请求失败: ${error.message}`);
      }
      throw error;
    }
  }
}
