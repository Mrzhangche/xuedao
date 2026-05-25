import { Inject, Provide } from '@midwayjs/core';
import { BaseService } from '@cool-midway/core';
import { KnowMultiLoader } from '../loader/multi';
import { KnowTextLoader } from '../loader/text';
import { KnowLinkLoader } from '../loader/link';

/**
 * 非结构化文档加载器
 */
@Provide()
export class KnowLoaderService extends BaseService {
  @Inject()
  knowMultiLoader: KnowMultiLoader;

  @Inject()
  knowTextLoader: KnowTextLoader;

  @Inject()
  knowLinkLoader: KnowLinkLoader;

  /**
   * 加载文本
   * @param text
   */
  async loadText(text: string) {
    return await this.knowTextLoader.load(text);
  }

  /**
   * 加载文件
   * @param filePath
   */
  async loadFile(filePath: string) {
    const fileContent = await this.knowMultiLoader.load(filePath);
    return {
      docs: fileContent,
      fileContent: fileContent.map(doc => doc.pageContent).join('\n\n'),
    };
  }

  /**
   * 加载链接
   * @param link
   * @returns
   */
  async loadLink(link: string) {
    return await this.knowLinkLoader.load(link, { titleOnly: true });
  }

  /**
   * 加载链接
   * @param link
   * @returns
   */
  async loadFileByLink(link: string) {
    return await this.knowMultiLoader.loadByLink(link);
  }

  /**
   * 解析链接
   * @param link
   * @param callback
   * @returns
   */
  async parseUrl(
    link: string,
    callback: (data: { url: string; title: string }) => void
  ) {
    return await this.knowLinkLoader.parseUrl(link, callback);
  }
}
