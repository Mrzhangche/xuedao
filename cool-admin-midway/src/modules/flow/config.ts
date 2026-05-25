import { ModuleConfig } from '@cool-midway/core';

/**
 * 模块配置
 */
export default () => {
  return {
    // 模块名称
    name: '流程编排',
    // 模块描述
    description: '流程管理、编排、调试、执行',
    // 中间件，只对本模块有效
    middlewares: [],
    // 中间件，全局有效
    globalMiddlewares: [],
    // 模块加载顺序，默认为0，值越大越优先加载
    order: 0,
    // 清理
    clear: {
      // 清理流程结果, 保留2天
      result: 2,
      // 清理流程日志, 保留10天
      log: 10,
    },
  } as ModuleConfig;
};
