import { BaseService, CoolCommException } from '@cool-midway/core';
import { App, IMidwayApplication, IMidwayContext } from '@midwayjs/core';
import { Init, Inject, Provide } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Equal, Not, Repository } from 'typeorm';
import { FlowInfoEntity } from '../entity/info';
import { NodeType } from '../nodes';
import { FlowNode } from '../runner/node';
import { FlowGraph } from '../runner/context';

/**
 * 流程信息
 */
@Provide()
export class FlowInfoService extends BaseService {
  @InjectEntityModel(FlowInfoEntity)
  flowInfoEntity: Repository<FlowInfoEntity>;

  @Inject()
  ctx: IMidwayContext;

  @App()
  app: IMidwayApplication;

  @Init()
  async init() {
    await super.init();
    this.setEntity(this.flowInfoEntity);
  }

  /**
   * 新增或更新
   * @param param
   * @param type
   */
  async addOrUpdate(param: FlowInfoEntity, type?: 'add' | 'update') {
    let check;
    if (type == 'add') {
      check = await this.flowInfoEntity.findOneBy({
        label: Equal(param.label),
      });
    }
    if (param.label && type == 'update') {
      check = await this.flowInfoEntity.findOneBy({
        label: Equal(param.label),
        id: Not(param.id),
      });
    }
    if (check) {
      throw new CoolCommException('标签已存在');
    }
    await super.addOrUpdate(param, type);
  }

  /**
   * 发布流程
   * @param flowId
   */
  async release(flowId: number) {
    const info = await this.flowInfoEntity.findOneBy({ id: Equal(flowId) });
    if (!info) {
      throw new CoolCommException('流程不存在');
    }
    info.version++;
    info.releaseTime = new Date();
    info.data = info.draft;
    await this.flowInfoEntity.update(info.id, info);
  }

  /**
   * 获得流程的节点
   * @param label
   * @param isDraft 是否是草稿，调试的时候调用草稿
   */
  async getNodes(
    label: string,
    isDraft = false
  ): Promise<{
    nodes: FlowNode[];
    info: FlowInfoEntity;
    graph: FlowGraph;
  }> {
    const info = await this.flowInfoEntity.findOneBy({
      label: Equal(label),
      status: 1,
    });
    if (!info) {
      throw new CoolCommException('流程不存在或被禁用');
    }
    const data = isDraft ? info.draft : info.data;
    if (!data) {
      throw new CoolCommException('流程未发布或损坏');
    }
    const nodes: FlowNode[] = [];
    // 构建所有节点
    for (const item of data.nodes) {
      const node: FlowNode = await this.app
        .getApplicationContext()
        .getAsync(NodeType[item.type]);
      node.id = item.id;
      node.flowId = info.id;
      node.label = item.label;
      node.type = item.type;
      node.desc = item.desc;
      node.config = {
        inputParams: item.data.inputParams,
        outputParams: item.data.outputParams,
        options: item.data.options,
      };
      nodes.push(node);
    }
    for (const item of data.edges) {
      const sourceNode = nodes.find(node => node.id == item.source);
      if (sourceNode) {
        item.sourceType = sourceNode.type;
      }
      const targetNode = nodes.find(node => node.id == item.target);
      if (targetNode) {
        item.targetType = targetNode.type;
      }
    }
    return {
      nodes,
      info,
      graph: data,
    };
  }

  /**
   * 根据标签获取流程信息
   * @param label
   */
  async getByLabel(label: string) {
    return await this.flowInfoEntity.findOneBy({ label: Equal(label) });
  }
}
