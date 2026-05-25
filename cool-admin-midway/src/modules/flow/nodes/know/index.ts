import { Inject, Provide, Scope, ScopeEnum } from '@midwayjs/core';
import { FlowNode } from '../../runner/node';
import { FlowContext } from '../../runner/context';
import { KnowRetrieverService } from '../../../know/service/retriever';
import * as _ from 'lodash';
import { FlowDataService } from '../../service/data';

/**
 * 知识库节点
 */
@Provide()
@Scope(ScopeEnum.Prototype)
export class NodeKnow extends FlowNode {
  @Inject()
  knowRetrieverService: KnowRetrieverService;

  @Inject()
  flowDataService: FlowDataService;

  /**
   * 执行
   * @param context
   * @returns
   */
  async run(context: FlowContext) {
    const { knowIds, size, minScore, graphLevel, graphSize } =
      this.config.options;
    const params = this.inputParams;
    const { text } = params;
    const objectId = context.getSessionId();
    const historyMessages =
      (await this.flowDataService.get(this.flowId, objectId)) || [];
    const documents = await this.knowRetrieverService.search(knowIds, text, {
      size,
      minScore,
      graphLevel,
      graphSize,
      history: historyMessages,
    });
    context.set(`${this.getPrefix()}.documents`, documents, 'output');
    const relations = item => {
      const contents = item['relations'];
      if (_.isEmpty(contents)) {
        return '';
      }
      return;
    };
    const str = documents
      .map(
        (item, index) =>
          `序号${index + 1}：\n\n 内容：${item.pageContent} \n\n ${relations}`
      )
      .join('/n/r');
    context.set(`${this.getPrefix()}.text`, str, 'output');
    return {
      success: true,
      result: {
        documents,
        text: str,
      },
    };
  }

  /**
   * 获取历史消息
   * @param context
   * @returns
   */
  async getHistoryMessages(context: FlowContext) {
    const objectId = context.getSessionId();
    return ((await this.flowDataService.get(this.flowId, objectId)) || []).map(
      item => item.content
    );
  }
}
