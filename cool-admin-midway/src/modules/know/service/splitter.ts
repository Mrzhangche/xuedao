import { Config, ILogger, Inject, Provide } from '@midwayjs/core';
import { BaseService, CoolCommException } from '@cool-midway/core';
import { KnowDataTypeService } from './data/type';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { CharacterTextSplitter } from '@langchain/textsplitters';
import { KnowDataSourceService } from './data/source';
import { KnowDataInfoService } from './data/info';
import { KnowSplitterConfig } from '../controller/admin/splitter';
import * as _ from 'lodash';
import { TokenTextSplitter } from '@langchain/textsplitters';
import { encodingForModel } from 'js-tiktoken';

/**
 * 知识拆分
 */
@Provide()
export class KnowSplitterService extends BaseService {
  @Inject()
  knowDataTypeService: KnowDataTypeService;

  @Inject()
  knowDataSourceService: KnowDataSourceService;

  @Inject()
  knowDataInfoService: KnowDataInfoService;

  @Inject()
  logger: ILogger;

  @Config('module.know.splitter')
  splitterConfig: {
    maxTokens: number;
    overlapTokens: number;
  };

  /**
   * 统计文本token数量
   * @param text 要统计的文本
   * @returns token数量
   */
  async getTokenCount(text: string): Promise<number> {
    try {
      const encoding = encodingForModel('gpt-4o');
      const tokens = encoding.encode(text);
      return tokens.length;
    } catch (error) {
      this.logger.error('统计token数量失败', error);
      const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
      const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;
      return Math.ceil(chineseChars * 1.5 + englishWords * 1.3);
    }
  }

  /**
   * 通用
   * @param config
   * @param callback
   */
  async comm(config: KnowSplitterConfig, callback: (chunk: string) => void) {
    const { type, typeId, sourceId } = config;
    if (type === 'quality') {
      await this.quality(typeId, sourceId, config.quality.prompt, callback);
    }
    if (type === 'quick') {
      await this.quick(typeId, sourceId, config.quick, callback);
    }
    if (type === 'not') {
      await this.not(typeId, sourceId, callback);
    }
  }

  /**
   * 不分段
   * @param typeId
   * @param sourceId
   * @param callback
   */
  async not(
    typeId: number,
    sourceId: number,
    callback: (chunk: string) => void
  ) {
    const { text, source } = await this.knowDataSourceService.getText(sourceId);
    callback(text);
    // 保存到数据库
    await this.knowDataInfoService.addOrUpdate(
      {
        typeId,
        sourceId,
        content: text,
        from: source.from,
      },
      'add'
    );
  }

  /**
   * 快速分段
   * @param document
   * @param config
   * @returns
   */
  async quick(
    typeId: number,
    sourceId: number,
    config: {
      chunkSize?: number;
      chunkOverlap?: number;
      separator?: string;
    },
    callback: (chunk: string) => void
  ) {
    const { text, source } = await this.knowDataSourceService.getText(sourceId);
    const textSplitter = new CharacterTextSplitter({
      chunkSize: config.chunkSize || 500,
      chunkOverlap: config.chunkOverlap || 50,
      separator: config.separator || '\n\n',
    });
    const chunks = await textSplitter.splitText(text);
    this.knowDataInfoService.addOrUpdate(
      chunks.map(chunk => ({
        typeId,
        sourceId,
        content: chunk,
        from: source.from,
      })),
      'add'
    );
    for (const chunk of chunks) {
      callback(chunk);
    }
  }

  /**
   * 智能分割文本，使用TokenTextSplitter按token数分割
   * @param text 原始文本
   * @param maxTokens 每个片段的最大token数
   * @param overlapTokens 片段之间的重叠token数
   * @returns 分割后的文本片段数组
   */
  private async _smartSplitText(
    text: string,
    maxTokens: number = 10000,
    overlapTokens: number = 500
  ): Promise<string[]> {
    const totalTokens = await this.getTokenCount(text);

    // 如果不超过限制，直接返回
    if (totalTokens <= maxTokens) {
      return [text];
    }

    this.logger.info(
      `文本token数${totalTokens}超过限制${maxTokens}，开始智能分割`
    );

    // 使用 TokenTextSplitter 进行分割
    const splitter = new TokenTextSplitter({
      encodingName: 'cl100k_base', // GPT-4 使用的编码
      chunkSize: maxTokens,
      chunkOverlap: overlapTokens,
    });

    const chunks = await splitter.splitText(text);
    this.logger.info(`文本已分割为${chunks.length}个片段`);

    return chunks;
  }

  /**
   * 处理高质量分段的LLM流式处理和数据持久化
   */
  private async _processQualityLlmStream(
    typeId: number,
    sourceId: number,
    prompt: string,
    text: string,
    source: any, // 明确 source 的类型会更好，这里暂时用 any
    callback: (chunk: string) => void,
    batchInfo?: { current: number; total: number } // 批次信息，用于日志
  ) {
    const tokenCount = await this.getTokenCount(text);
    const batchLog = batchInfo
      ? `[批次 ${batchInfo.current}/${batchInfo.total}] `
      : '';
    this.logger.info(`${batchLog}处理文本，token数: ${tokenCount}`);
    // 吞吐量优先
    const llm = await this.knowDataTypeService.getLLMModel(
      typeId,
      'throughput'
    );
    const s1 = '输出的内容首尾不必带```markdown```';
    const s2 = '标签：`团队`、`地址`、`公司`';

    // 根据是否为批次处理调整系统提示词
    const contextNote =
      batchInfo && batchInfo.current > 1
        ? '\n- 注意：这是一个大文档的部分内容，前面可能有相关上下文，处理时考虑内容的连贯性；'
        : '';

    const sysPrompt = ChatPromptTemplate.fromMessages([
      [
        'system',
        `
        # 角色
        你是一个专业的文档分割高手，将一个大的文档分为多块，分块会被存储于RAG系统中
        - 所提供的文档格式排版可能比较凌乱，需要重新美化排版；
        - 除了排版外和去除无意义信息外，尽量跟随原文描述，不要自己总结和扩写；
        - 给每块文档的后面打上标签；
        - 可以根据标题、小标题、内容含义等进行分块，细小的点不要分割到不同的文档中；
        - 如果某个主题下的内容较少(少于500字)，但是也有分小点，这种情况合并到一个块；
        - 每个分块的内容不能太少，只有太长了实在无法分到一起才进行分块；${contextNote}

        # 输出
        - 输出纯净版本的markdown格式；
        - 将每块文档包含在<chunk></chunk>中；
        - 不要输出任何解释性和说明性信息；
        - 要给文档分成多块信息，而不是只有一块；
        - 除分块内容，不要输出其他任何无关信息；
        - 输出的内容首尾不必带${s1}
        - Absolutely prohibit modifying the image link address; keep it as is.
        - Display the image using Markdown's image format.；
        - link 127.0.0.0.1 is invalid, 127.0.0.1 is valid;
        - 示例：
        <chunk>
        COOL团队坐落于美丽的厦门，团队成员有啊平、无风、神仙等，归属于闪酷科技

        ${s2}
        </chunk>
       `,
      ],
      [
        'human',
        `
        # 特殊要求(如果有特殊要求以特殊要求为主)
        {prompt}
        输入文档：{text}`,
      ],
    ]);
    const chain = sysPrompt.pipe(llm);
    const controller = new AbortController();
    try {
      const result = await chain.stream(
        { text, prompt },
        { signal: controller.signal }
      );

      let content = '';
      let pendingChunk = '';
      let chunkStarted = false;

      // 处理流式结果
      for await (const chunk of result) {
        content += chunk.text;
        pendingChunk += chunk.text;

        // 查找完整的chunk标签
        while (true) {
          // 如果还没开始chunk处理，检查是否有开始标签
          if (!chunkStarted) {
            const startIndex = pendingChunk.indexOf('<chunk>');
            if (startIndex !== -1) {
              // 移除开始标签之前的内容
              pendingChunk = pendingChunk.substring(startIndex + 7);
              chunkStarted = true;
            } else {
              // 没有找到开始标签，跳出循环继续等待
              break;
            }
          }

          // 已经找到开始标签，检查是否有结束标签
          if (chunkStarted) {
            const endIndex = pendingChunk.indexOf('</chunk>');
            if (endIndex !== -1) {
              // 提取完整的chunk内容
              const chunkContent = pendingChunk.substring(0, endIndex).trim();

              // 处理完整的chunk
              if (chunkContent && chunkContent.trim() !== '```') {
                // 回调完整的块
                callback(chunkContent);

                const check = await this.knowDataSourceService.info(sourceId);
                if (!check) {
                  this.logger.warn('资源已删除');
                  if (controller) {
                    controller.abort();
                    controller == null;
                  }
                }

                // 保存到数据库
                await this.knowDataInfoService.addOrUpdate(
                  {
                    typeId,
                    sourceId,
                    content: chunkContent,
                    from: source.from,
                  },
                  'add'
                );
              }

              // 移除已处理的chunk
              pendingChunk = pendingChunk.substring(endIndex + 8);
              chunkStarted = false;
            } else {
              // 没有找到结束标签，跳出循环继续等待
              break;
            }
          }
        }
      }

      // 处理最后可能存在的不完整chunk
      if (pendingChunk.trim() && pendingChunk.trim() !== '```') {
        // 如果还有剩余内容但没有正确的chunk格式，将其作为一个独立chunk处理
        callback(pendingChunk.trim());

        const check = await this.knowDataSourceService.info(sourceId);
        if (!check) {
          this.logger.warn('资源已删除');
          if (controller) {
            controller.abort();
            controller == null;
          }
        }
        await this.knowDataInfoService.addOrUpdate(
          {
            typeId,
            sourceId,
            content: pendingChunk.trim(),
            from: source.from,
          },
          'add'
        );
      }
    } catch (e) {
      if (e.message == 'Aborted') {
        this.logger.warn('中断取消');
      } else {
        // 重新抛出其他类型的错误
        this.logger.error(`${batchLog}处理失败`, e);
        throw e;
      }
    } finally {
      if (controller) {
        controller.abort();
        controller == null;
      }
    }
  }

  /**
   * 高质量
   * @param typeId
   * @param sourceId
   * @param prompt
   * @param callback
   */
  async quality(
    typeId: number,
    sourceId: number,
    prompt: string,
    callback: (chunk: string) => void
  ) {
    const { text, source } = await this.knowDataSourceService.getText(sourceId);

    // csv特殊处理
    if (source.content.endsWith('.csv')) {
      const csvDatas = text.split('---sep---');
      const batchSize = 20;
      let headContent = '';
      if (!_.isEmpty(csvDatas)) {
        headContent = csvDatas[0];
        csvDatas.shift();
      }
      for (let i = 0; i < csvDatas.length; i += batchSize) {
        const chunk = csvDatas.slice(i, i + batchSize).join('---sep---\n\n');
        const check = await this.knowDataSourceService.info(sourceId);
        if (!check) {
          this.logger.warn('资源已删除');
          break;
        }
        const csvText = headContent + '---sep---\n\n' + chunk;

        // 对CSV内容也进行智能分割
        const csvChunks = await this._smartSplitText(
          csvText,
          this.splitterConfig.maxTokens,
          this.splitterConfig.overlapTokens
        );
        for (let j = 0; j < csvChunks.length; j++) {
          await this._processQualityLlmStream(
            typeId,
            sourceId,
            prompt,
            csvChunks[j],
            source,
            callback,
            csvChunks.length > 1
              ? { current: j + 1, total: csvChunks.length }
              : undefined
          );
        }
      }
      return; // CSV处理完成后直接返回
    }

    // 普通文本处理：使用智能分割
    const textChunks = await this._smartSplitText(
      text,
      this.splitterConfig.maxTokens,
      this.splitterConfig.overlapTokens
    );

    // 如果只有一个分片，说明没超过限制，使用原来的逻辑
    if (textChunks.length === 1) {
      await this._processQualityLlmStream(
        typeId,
        sourceId,
        prompt,
        text,
        source,
        callback
      );
    } else {
      // 多个分片，批量处理
      this.logger.info(`文本已分为${textChunks.length}批次处理`);
      for (let i = 0; i < textChunks.length; i++) {
        const check = await this.knowDataSourceService.info(sourceId);
        if (!check) {
          this.logger.warn('资源已删除，停止处理');
          break;
        }

        await this._processQualityLlmStream(
          typeId,
          sourceId,
          prompt,
          textChunks[i],
          source,
          callback,
          { current: i + 1, total: textChunks.length }
        );
      }
    }
  }
}
