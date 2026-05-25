import { MidwayCache } from '@midwayjs/cache-manager';
import { IMidwayApplication } from '@midwayjs/core';
import { TypeORMDataSourceManager } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import * as _ from 'lodash';
import { PluginService } from '../../../plugin/service/info';
import { FlowContext } from '../../runner/context';
import { FlowNode } from '../../runner/node';

/**
 * 代码执行基类
 */

export class BaseCode {
  /**
   * 数据源管理器
   */
  typeORMDataSourceManager: TypeORMDataSourceManager;

  /**
   * 应用
   */
  app: IMidwayApplication;

  /**
   * 插件服务
   */
  pluginService: PluginService;

  /**
   * 缓存
   */
  cache: MidwayCache;

  /**
   * 上下文
   */
  context: FlowContext;

  /**
   * 节点
   */
  node: FlowNode;

  /**
   * 主函数
   */
  async main(params: any) {}

  /**
   * 执行sql
   * @param sql sql语句
   * @param params 参数
   * @param dataSource 数据源
   */
  async execSql(sql: string, params = [], dataSource = 'default') {
    const ormManager = this.typeORMDataSourceManager.getDataSource(dataSource);
    return await ormManager.query(sql, params);
  }

  /**
   * 获得typeorm的Repository
   * @param entityName
   * @returns
   */
  async getRepository(entityName: string): Promise<Repository<any>> {
    const getEntityByName = async () => {
      const dataSourceNames =
        this.typeORMDataSourceManager.getDataSourceNames();
      for (const dataSourceName of dataSourceNames) {
        const entityMetadatas =
          await this.typeORMDataSourceManager.getDataSource(dataSourceName)
            .entityMetadatas;
        const find = _.find(entityMetadatas, { name: entityName });
        if (find) {
          return find.target;
        }
      }
    };
    const entity = await getEntityByName();
    const dataSource =
      this.typeORMDataSourceManager.getDataSourceNameByModel(entity);
    const ormManager = this.typeORMDataSourceManager.getDataSource(dataSource);
    return ormManager.getRepository(entityName);
  }

  /**
   * 调用service
   * @param service 服务
   * @param method 方法
   * @param args 参数
   * @returns
   */
  async invokeService(service: string, method: string, ...args) {
    const serviceInstance = await this.app
      .getApplicationContext()
      .getAsync(service);
    return serviceInstance[method](...args);
  }

  /**
   * 调用插件
   * @param key 插件的key
   * @param method 插件的方法
   * @param args 参数
   * @returns
   */
  async invokePlugin(key: string, method: string, ...args) {
    return this.pluginService.invoke(key, method, ...args);
  }
}
