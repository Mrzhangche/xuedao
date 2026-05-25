import { DocumentInterface } from '@langchain/core/documents';
import { KnowRerankBase } from './base';
import { CohereRerank } from '@langchain/cohere';

/**
 * cohere重排 https://docs.cohere.com/reference/rerank
 */
export class KnowRerankCohere extends KnowRerankBase {
  cohere: CohereRerank;

  /**
   * 配置
   * @param options
   */
  config(options: any) {
    this.cohere = new CohereRerank(options);
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
    const result = this.cohere.rerank(docs, text, { topN });
    return result;
  }
}
