import { Provide, Scope, ScopeEnum } from '@midwayjs/core';
import { FlowNode } from '../../runner/node';
import { FlowContext } from '../../runner/context';
import { FlowResult } from '../../runner/result';
import * as ts from 'typescript';
import { CoolCommException } from '@cool-midway/core';

/**
 * 变量
 */
@Provide()
@Scope(ScopeEnum.Prototype)
export class NodeVariable extends FlowNode {
  /**
   * 执行
   * @param context
   */
  async run(context: FlowContext): Promise<FlowResult> {
    const { inputParams, outputParams } = this.config;
    const datas = context.getData('output') as Map<string, any>;
    let result = {};
    // 输入
    if (!context.isDebugOne()) {
      for (const param of inputParams) {
        const value = param.value
          ? param.value
          : datas.get(`${this.getParamPrefix(param)}.${param.name}`);
        result[param.field] = value;
      }
      this.inputParams = result;
    } else {
      result = this.inputParams;
    }
    // 执行代码进行转换
    result = await this.exec(this.config.options.code, result);
    // 输出
    for (const param of outputParams) {
      context.set(
        `${this.getPrefix()}.${param.field}`,
        result[param.field],
        'output'
      );
    }
    return {
      success: true,
      result,
    };
  }

  /**
   * 执行代码
   * @param content
   * @param params
   * @returns
   */
  async exec(content: string, params: any) {
    let funcMain;
    const script = `
        ${this.convertToJs(content)} 
        funcMain = main;
    `;
    eval(script);
    if (!funcMain) {
      throw new CoolCommException('未找到main函数，请检查代码后重试');
    }
    return await funcMain(params);
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
