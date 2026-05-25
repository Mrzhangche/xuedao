import { Inject, Provide } from '@midwayjs/core';
import { BaseService, CoolCommException } from '@cool-midway/core';
import { SearchOptions } from '../interface';
import { VectorStore } from '@langchain/core/vectorstores';
import { Config, IMidwayContext } from '@midwayjs/core';
import {} from '../store/base';
import { KnowStore } from '../store';
import { KnowDataTypeService } from './data/type';
import { DocumentInterface } from '@langchain/core/documents';
import { KnowConfigService } from './config';
import { RerankModel } from '../rerank';
import { KnowRerankBase } from '../rerank/base';
import { KnowDataTypeEntity } from '../entity/data/type';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { Utils } from '../../../comm/utils';
import { KnowDataSourceService } from './data/source';
import { KnowGraphService } from './graph';
import { KnowDataInfoService } from './data/info';
import * as _ from 'lodash';

/**
 * 检索服务
 */
@Provide()
export class KnowRetrieverService extends BaseService {
  @Inject()
  ctx: IMidwayContext;

  @InjectEntityModel(KnowDataTypeEntity)
  knowDataTypeEntity: Repository<KnowDataTypeEntity>;

  @Inject()
  knowStore: KnowStore;

  @Config('module.know.prefix')
  prefix: string;

  @Config('module.know.indexCount')
  indexCount: number;

  @Inject()
  knowDataTypeService: KnowDataTypeService;

  @Inject()
  knowDataInfoService: KnowDataInfoService;

  @Inject()
  knowDataSourceService: KnowDataSourceService;

  @Inject()
  knowConfigService: KnowConfigService;

  @Inject()
  knowGraphService: KnowGraphService;

  @Inject()
  utils: Utils;

  /**
   * 智能调用
   * @param knowId
   * @param text
   * @param options
   * @returns
   */
  async invoke(
    knowId: number,
    text: string,
    options?: SearchOptions
  ): Promise<[DocumentInterface, number][]> {
    const type = await this.knowDataTypeEntity.findOneBy({ id: knowId });
    if (!type) {
      throw new CoolCommException('知识库不存在');
    }
    const store = await this.getStore(type.collectionId);
    const keywords = await this.genKeywords(
      knowId,
      text,
      type.indexType,
      options?.history
    );
    const results = await Promise.all(
      keywords.map(keyword => {
        return store.similaritySearchWithScore(keyword, this.indexCount, {
          collectionId: type.collectionId,
        });
      })
    );
    const result = results.flat();
    // 去除ID相同的
    const uniqueResult = result.filter(
      (item, index, self) =>
        index === self.findIndex(t => t[0].id === item[0].id)
    );
    let documents = await this.rerank(
      knowId,
      text,
      uniqueResult,
      options,
      keywords
    );
    // 排序documents
    documents.sort((a, b) => b[1] - a[1]);
    // 截取前N个
    documents = documents.slice(0, options?.size || 10);
    // 匹配资源
    await this.knowDataSourceService.match(documents);
    documents = documents
      .map(e => {
        e[1] = parseFloat(e[1]);
        return e;
      })
      .filter(e => {
        return e[1] >= (options?.minScore || 0);
      });
    // 图谱搜索
    await this.graph(knowId, documents, options);
    return documents;
  }

  /**
   * 图谱搜索
   * @param knowId
   * @param documents
   * @param options
   * @returns
   */
  async graph(
    knowId: number,
    documents: [DocumentInterface, number][],
    options?: SearchOptions
  ) {
    const type = await this.knowDataTypeEntity.findOneBy({ id: knowId });
    if (!type) {
      throw new CoolCommException('知识库不存在');
    }
    if (type.indexType != 2) {
      return;
    }
    let topN = 3;
    let index = 0;
    for (const doc of documents) {
      const graph = await this.knowGraphService.search(
        knowId,
        doc[0].id,
        options?.graphLevel || 3,
        options?.graphSize || 10
      );
      const contents = await this.knowDataInfoService.getContentByIds(
        graph.map(item => item.chunkId)
      );
      doc[0]['relations'] = contents.map(item => {
        const graphInfo = graph.find(e => e.chunkId === item.id);
        return {
          content: item.content,
          relations: graphInfo.relations,
        };
      });
      index++;
      if (index >= topN) {
        break;
      }
    }
    return documents;
  }

  /**
   * 生成关键词
   * @param knowId
   * @param text
   * @param indexType
   * @param history 历史消息
   * @returns
   */
  async genKeywords(
    knowId: number,
    text: string,
    indexType: number,
    history?: any[]
  ) {
    if (indexType == 0) {
      return [text];
    }
    const llm = await this.knowDataTypeService.getLLMModel(knowId);
    const format = `
      ["keyword1", "keyword2", "keyword3"]
    `;

    // 构建历史消息文本
    let historyText = '';
    if (history && history.length > 0) {
      historyText =
        "\n\n# Chat History\nHere is the conversation history to help you understand the user's intent:\n" +
        history.map(item => `${item.role}: ${item.content}`).join('\n');
    }

    const prompt = ChatPromptTemplate.fromMessages([
      [
        'system',
        `
        # Role
        You are a professional keyword generation expert. Please generate a set of search keywords based on the text provided by the user. The keywords will be used to search the knowledge base. Generate 3-5 keywords. The language of the keywords should match the language of the user's text.
        You should understand the user's intent and generate keywords that need to be queried, rather than deriving keywords from the literal meaning.
        ${
          history && history.length > 0
            ? "\n\n# Context Understanding\nIf there is chat history, please combine the historical message context to understand the user's current question and generate more accurate keywords. The chat history helps you understand the continuity and contextual relationship of the conversation."
            : ''
        }
        ${historyText}
        # Output
        Output only a minified JSON object with no extra text or formatting.
        {format}
        `,
      ],
      ['user', '{text}'],
    ]);
    const chain = prompt.pipe(llm);
    const result = await chain.invoke({ text, format });
    const keywords = this.utils
      .extractJSONFromText(result.text || '[]')
      .concat(text);
    return Array.from(new Set(keywords)) as string[];
  }

  /**
   * 重新排序调用rerank
   * @param knowId
   * @param result
   * @returns
   */
  async rerank(
    knowId: number,
    text: string,
    documents: [DocumentInterface, number][],
    options?: SearchOptions,
    keywords?: string[]
  ) {
    const know = await this.knowDataTypeEntity.findOneBy({ id: knowId });
    // 处理rerank
    if (!know.enableRerank || _.isEmpty(documents)) {
      return documents;
    }
    const config = await this.knowConfigService.info(know.rerankConfigId);
    const rerank: KnowRerankBase = new RerankModel[config.type]();
    rerank.config({
      ...config.options.comm,
      ...know.rerankOptions,
    });
    const res = await rerank.rerank(
      documents.map(item => item[0]),
      keywords.join(';'),
      options?.size || 10
    );
    // 对比 重新返回新的结果
    const newResult = [];
    for (const item of res) {
      const arr = [];
      arr.push(documents[item.index][0]);
      arr.push(item.relevanceScore);
      newResult.push(arr);
    }
    return newResult;
  }

  /**
   * 搜索
   * @param collectionIds 集合ID 多个
   * @param text 文本
   * @param options 配置
   */
  async search(knowIds: number[], text: string, options: SearchOptions) {
    const results: [DocumentInterface, number][][] = await Promise.all(
      knowIds.map(knowId => {
        return this.invoke(knowId, text, options);
      })
    );
    // 合并结果，按照得分排序 number是得分
    const result = results.reduce((prev, curr) => {
      return prev.concat(curr);
    }, []);
    result.sort((a, b) => b[1] - a[1]);
    // 只返回文档结果，并取前N个
    return result.map(item => item[0]).slice(0, options.size || 10);
  }

  /**
   * 获得存储器
   * @param knowIds
   * @returns
   */
  async getStores(collectionIds: string[]): Promise<VectorStore[]> {
    return await Promise.all(
      collectionIds.map(collectionId => {
        return this.getStore(collectionId);
      })
    );
  }

  /**
   * 获得存储器
   * @param knowId
   * @returns
   */
  async getStore(collectionId: string): Promise<VectorStore> {
    const store = await this.knowStore.get(collectionId);
    return await store.getStore(`${this.prefix}${collectionId}`);
  }
}
