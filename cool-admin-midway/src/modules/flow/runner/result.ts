import { FlowStream } from './stream';

/**
 * 结果
 */
export interface FlowResult {
  /**
   * 是否成功
   */
  success: boolean;
  /**
   * 异常信息(如果有则返回)
   */
  error?: {
    /**
     * 异常出现的节点
     */
    nodeId?: string;
    /**
     * 异常信息
     */
    message?: string;
    /**
     * 原始 Error
     */
    error?: Error;
    /**
     * options配置信息
     */
    options?: any;
  };
  /**
   * 返回结果
   */
  result?: any;
  /**
   * 所以已经执行的节点信息
   */
  nodesResult?: any;
  /**
   * 下个节点，如果有多个下个节点，当前节点需要做出判断选择一个节点执行
   */
  next?: { id: string; type: string }[];

  /**
   * stream流
   */
  stream?: FlowStream;
}
