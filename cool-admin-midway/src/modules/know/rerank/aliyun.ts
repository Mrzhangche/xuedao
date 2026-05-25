import { DocumentInterface } from '@langchain/core/documents';
import { KnowRerankBase } from './base';
import axios from 'axios';

/**
 * 阿里云重排 https://bailian.console.aliyun.com/
 */
export class KnowRerankAliyun extends KnowRerankBase {
  options: {
    apiKey: string;
    model: string;
  };

  /**
   * 配置
   * @param options
   */
  config(options: any) {
    this.options = options;
  }

  /**
   * 重排
   * @param docs
   * @param text
   * @param topN
   */
  async rerank(
    docs: DocumentInterface<Record<string, any>>[],
    text: string,
    topN: number
  ): Promise<{ index: number; relevanceScore: number }[]> {
    const result = await axios.post(
      'https://dashscope.aliyuncs.com/api/v1/services/rerank/text-rerank/text-rerank',
      {
        input: {
          documents: docs.map(item => item.pageContent),
          query: text,
        },
        model: this.options.model,
        parameters: {
          top_n: topN,
          return_documents: false,
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.options.apiKey}`,
        },
      }
    );
    const results = await result.data.output.results;
    return results.map((item: any) => ({
      index: item.index,
      relevanceScore: item.relevance_score,
    }));
  }
}
