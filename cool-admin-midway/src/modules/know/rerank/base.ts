import { DocumentInterface } from '@langchain/core/documents';

/**
 * 重排基类
 */
export abstract class KnowRerankBase {
  /**
   * 重排
   * @param docs 文档
   * @param text 文本
   * @param topN
   * @returns
   */
  abstract rerank(
    docs: DocumentInterface[],
    text: string,
    topN: number
  ): Promise<{ index: number; relevanceScore: number }[]>;

  /**
   * 配置
   * @param options
   */
  abstract config(options: any);
}
