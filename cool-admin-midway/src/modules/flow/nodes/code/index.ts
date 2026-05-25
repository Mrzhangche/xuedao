import {
  App,
  IMidwayApplication,
  Inject,
  InjectClient,
  Provide,
  Scope,
  ScopeEnum,
} from '@midwayjs/core';
import { FlowNode } from '../../runner/node';
import { FlowContext } from '../../runner/context';
import { CoolCommException } from '@cool-midway/core';
import * as ts from 'typescript';
import { CachingFactory, MidwayCache } from '@midwayjs/cache-manager';
import { TypeORMDataSourceManager } from '@midwayjs/typeorm';
import { PluginService } from '../../../plugin/service/info';
import { BaseCode } from './base';

/**
 * 代码执行器
 */
@Provide()
@Scope(ScopeEnum.Prototype)
export class NodeCode extends FlowNode {
  @Inject()
  typeORMDataSourceManager: TypeORMDataSourceManager;

  @App()
  app: IMidwayApplication;

  @Inject()
  pluginService: PluginService;

  @InjectClient(CachingFactory, 'default')
  cache: MidwayCache;

  /**
   * 执行
   * @param context
   */
  async run(context: FlowContext) {
    const { outputParams, options } = this.config;
    // 获得输入参数
    const params = this.inputParams;
    const execResult = await this.exec(options.code, params);
    for (const param of outputParams) {
      context.set(
        `${this.getPrefix()}.${param.field}`,
        execResult[param.field],
        'output'
      );
    }
    return {
      success: true,
      result: execResult,
    };
  }

  /**
   * 执行代码
   * @param content
   * @param params
   * @returns
   */
  async exec(content: string, params: any) {
    // @ts-ignore
    let CoolClass;
    // @ts-ignore
    let Base = BaseCode;
    const script = `
        ${this.convertToJs(content)} 
        CoolClass = Cool;
    `;
    eval(script);
    if (!CoolClass) {
      throw new CoolCommException('未找到Cool类，请检查代码后重试');
    }
    const cool: BaseCode = new CoolClass();
    cool.app = this.app;
    cool.cache = this.cache;
    cool.pluginService = this.pluginService;
    cool.typeORMDataSourceManager = this.typeORMDataSourceManager;
    cool.context = this.context;
    cool.node = this;
    if (!cool.main) {
      throw new CoolCommException('未找到main函数，请检查代码后重试');
    }
    return await cool.main(params);
  }

  /**
   * 转换为js
   * @param content
   * @returns
   */
  convertToJs(content: string) {
    return ts.transpile(content, {
      emitDecoratorMetadata: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2018,
      removeComments: true,
      experimentalDecorators: true,
      noImplicitThis: true,
      noUnusedLocals: true,
      stripInternal: true,
      skipLibCheck: true,
      pretty: true,
      declaration: true,
      noImplicitAny: false,
    });
  }
}
