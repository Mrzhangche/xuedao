import { Provide } from '@midwayjs/core';
import { Document } from '@langchain/core/documents';

/**
 * 文本加载器
 */
@Provide()
export class KnowTextLoader {
  /**
   * 加载文档
   * @param text
   */
  async load(text: string) {
    return [new Document({ pageContent: text, metadata: {} })];
  }
}
