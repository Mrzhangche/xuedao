import { Init, Inject, Provide } from '@midwayjs/core';
import { BaseService, CoolEventManager } from '@cool-midway/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Equal, Repository } from 'typeorm';
import { FlowConfigEntity } from '../entity/config';
import { FlowAllConfig, FlowNodeConfig, NodeTypeKey } from '../nodes';
import { KnowDataTypeService } from '../../know/service/data/type';
import { FlowMcpClient } from '../mcp/client';

/**
 * 流程配置
 */
@Provide()
export class FlowConfigService extends BaseService {
  @InjectEntityModel(FlowConfigEntity)
  flowConfigEntity: Repository<FlowConfigEntity>;

  @Inject()
  knowDataTypeService: KnowDataTypeService;

  @Inject()
  flowMcpClient: FlowMcpClient;

  @Inject()
  coolEventManager: CoolEventManager;

  @Inject()
  ctx;

  @Init()
  async init() {
    await super.init();
    this.setEntity(this.flowConfigEntity);
  }

  /**
   * 获得配置
   * @param node 节点
   * @param type 类型
   */
  async config(node: NodeTypeKey, type?: string) {
    // 知识库
    if (node == 'know') {
      return {
        knows: await this.knowDataTypeService.getKnows(),
      };
    }
    return type ? FlowNodeConfig[node][type] : FlowNodeConfig[node];
  }

  /**
   * 所有配置
   * @returns
   */
  async all() {
    return FlowAllConfig;
  }

  /**
   * 获得配置
   * @param configId
   * @returns
   */
  async getOptions(configId: number) {
    const config = await this.flowConfigEntity.findOneBy({
      id: Equal(configId),
    });
    return config?.options;
  }

  /**
   * 获得配置
   * @param configId
   * @returns
   */
  async getConfig(configId: number) {
    return await this.flowConfigEntity.findOneBy({ id: Equal(configId) });
  }

  /**
   * 通过名称获取配置
   * @param node 类型
   * @param type 类型
   * @returns
   */
  async getByNode(node: string, type?: string): Promise<FlowConfigEntity[]> {
    const find = await this.flowConfigEntity.createQueryBuilder('a');
    if (type) {
      find.where('a.type = :type', { type });
    }
    if (node) {
      find.andWhere('a.node = :node', { node });
    }
    return await find.getMany();
  }

  /**
   * 通过名称获取配置
   * @param name 名称
   * @param node 类型
   * @returns
   */
  async getByName(name: string, node?: string): Promise<FlowConfigEntity> {
    const find = await this.flowConfigEntity.createQueryBuilder('a');
    if (name) {
      find.where('a.name = :name', { name });
    }
    if (node) {
      find.andWhere('a.node = :node', { node });
    }
    return await find.getOne();
  }

  /**
   * 删除
   * @param ids
   */
  async delete(ids: any): Promise<void> {
    for (const id of ids) {
      const info = await this.flowConfigEntity.findOneBy({
        id: Equal(id),
      });
      if (info?.node == 'mcp') {
        this.coolEventManager.globalEmit('mcp.client.remove', false, info.name);
      }
    }
    await super.delete(ids);
  }

  /**
   * 修改后
   * @param data
   * @param type
   */
  async modifyAfter(
    data: any,
    type: 'delete' | 'update' | 'add'
  ): Promise<void> {
    if (type == 'update' || type == 'add') {
      const info = await this.flowConfigEntity.findOneBy({
        id: Equal(data.id),
      });
      if (info?.node == 'mcp') {
        await this.flowMcpClient.ping(info);
        this.coolEventManager.globalEmit('mcp.client.initOne', false, info);
      }
    }
  }
}
