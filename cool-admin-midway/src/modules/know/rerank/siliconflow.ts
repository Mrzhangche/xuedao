import { DocumentInterface } from '@langchain/core/documents';
import { KnowRerankBase } from './base';
import axios from 'axios';

/**
 * 硅基流动重排 https://docs.siliconflow.cn/cn/api-reference/rerank/create-rerank
 */
export class KnowRerankSiliconflow extends KnowRerankBase {
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
      'https://api.siliconflow.cn/v1/rerank',
      {
        documents: docs.map(item => item.pageContent),
        query: text,
        model: this.options.model,
        top_n: topN,
        return_documents: false,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.options.apiKey}`,
        },
      }
    );
    const results = await result.data.results;
    return results.map((item: any) => ({
      index: item.index,
      relevanceScore: item.relevance_score,
    }));
  }
}
