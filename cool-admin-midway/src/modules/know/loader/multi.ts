import { Inject, Provide } from '@midwayjs/core';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { CSVLoader } from '@langchain/community/document_loaders/fs/csv';
import { DocxLoader } from '@langchain/community/document_loaders/fs/docx';
import { PPTXLoader } from '@langchain/community/document_loaders/fs/pptx';
import { Document } from '@langchain/core/documents';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import { CoolCommException } from '@cool-midway/core';
import { PluginService } from '../../plugin/service/info';

/**
 * 多文档加载器
 */
@Provide()
export class KnowMultiLoader {
  @Inject()
  pluginService: PluginService;

  /**
   * 加载文档
   * @param filePath
   */
  async load(filePath: any) {
    const ext = path.extname(filePath).toLowerCase();
    let loader;

    switch (ext) {
      case '.txt':
        // 使用 fs 直接读取文本文件
        return [
          new Document({
            pageContent: fs.readFileSync(filePath, 'utf-8'),
            metadata: { source: filePath },
          }),
        ];
        break;
      case '.md':
        // 使用 fs 直接读取文本文件
        return [
          new Document({
            pageContent: fs.readFileSync(filePath, 'utf-8'),
            metadata: { source: filePath },
          }),
        ];
      case '.pdf':
        loader = new PDFLoader(filePath, { splitPages: false });
        break;
      case '.csv':
        loader = new CSVLoader(filePath);
        const csvDocs = await loader.load();
        // 如果是csv，则合成一个文档
        const csvContent = csvDocs
          .map(item => item.pageContent)
          .join('---sep---\n\n');
        return [
          new Document({
            pageContent: csvContent,
            metadata: { source: filePath },
          }),
        ];
      case '.docx':
        loader = new DocxLoader(filePath);
        break;
      case '.pptx':
        loader = new PPTXLoader(filePath);
        break;
      default:
        throw new CoolCommException(`不支持的文件类型: ${ext}`);
    }

    return await loader.load();
  }

  /**
   * 转换为 Markdown
   * @param fileUrl
   * @returns
   */
  async toMarkdown(fileUrl: string) {
    const ext = path.extname(fileUrl).toLowerCase().replace('.', '');
    const supports = [
      'pdf',
      'doc',
      'docx',
      'ppt',
      'pptx',
      'png',
      'jpg',
      'jpeg',
    ];
    // 使用高级解析
    if (supports.includes(ext)) {
      const getPlugins = async () => {
        const plugins: any = {};
        try {
          // @ts-ignore
          const ali = await this.pluginService.getInstance('ali-doc-parser');
          plugins.ali = ali;
        } catch (e) {}
        try {
          // @ts-ignore
          const minerU = await this.pluginService.getInstance(
            'mineru-doc-parser'
          );
          plugins.minerU = minerU;
        } catch (e) {}
        return plugins;
      };
      const plugins = await getPlugins();

      // 获取可用的插件列表
      const availablePlugins = [];
      if (plugins.ali) availablePlugins.push('ali');
      if (plugins.minerU) availablePlugins.push('minerU');

      // 如果没有任何插件，返回 null
      if (availablePlugins.length === 0) {
        return null;
      }

      // 选择要使用的插件
      let selectedPlugin;
      if (availablePlugins.length === 1) {
        // 只有一个插件，使用那个
        selectedPlugin = availablePlugins[0];
      } else {
        // 有两个插件，随机选一个
        const randomIndex = Math.floor(Math.random() * availablePlugins.length);
        selectedPlugin = availablePlugins[randomIndex];
      }

      // 根据选中的插件调用相应的方法
      let markdown;
      if (selectedPlugin === 'minerU') {
        markdown = await plugins.minerU.submitAndWaitForMarkdown({
          url: fileUrl,
          is_ocr: true,
        });
      } else if (selectedPlugin === 'ali') {
        markdown = await plugins.ali.submitAndWaitForMarkdown({
          fileUrl: fileUrl,
        });
      }

      return markdown;
    }

    return null;
  }

  /**
   * 通过链接加载
   * @param link
   * @returns
   */
  async loadByLink(link: string) {
    const markdown = await this.toMarkdown(link);
    if (markdown) {
      return markdown;
    }
    const download = require('download');
    const fs = require('fs');
    const crypto = require('crypto');

    // 从URL中获取文件扩展名
    const urlObj = new URL(link);
    const pathname = urlObj.pathname;
    const ext = path.extname(pathname) || '.txt';

    // 创建临时文件名
    const tempFileName = path.join(
      os.tmpdir(),
      `${crypto.randomBytes(6).toString('hex')}${ext}`
    );

    try {
      // 下载文件到临时目录
      const data = await download(
        link !== decodeURIComponent(link) ? link : encodeURI(link)
      );
      fs.writeFileSync(tempFileName, data);

      // 加载文件内容
      const docs = await this.load(tempFileName);
      return docs.map(item => item.pageContent)[0];
    } finally {
      // 删除临时文件
      if (fs.existsSync(tempFileName)) {
        fs.unlinkSync(tempFileName);
      }
    }
  }
}
