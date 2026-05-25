/**
 * 上下文数据
 */
export interface FlowContextData {
  input: Map<string, any>;
  output: Map<string, any>;
  result: Map<string, any>;
}

/**
 * 节点执行信息
 */
export interface FlowNodeExec {
  // 当前节点
  current: string;
  // 上一个节点
  prev: string;
  // 下一个节点
  next: string;
  // 下一个节点列表
  nextList: string[];
}

/**
 * 节点信息
 */
export interface NodeInfo {
  enable?: boolean;
  id?: string;
  label?: string;
  type?: string;
  icon?: string;
  name?: `node-${string}`;
  position?: {
    x: number;
    y: number;
  };
  form?: {
    width?: string;
    focus?: string;
    items: any[];
  };
  handle?: {
    target?: boolean;
    source?: boolean;
    next?: { label: string; value: string; [key: string]: any }[];
  };
  data?: {
    inputParams?: any[];
    outputParams?: any[];
    options?: any;
  };
  [key: string]: any;
}

/**
 * 线信息
 */
export interface LineInfo {
  id: string;
  target: string;
  type?: string;
  sourceType?: string;
  targetType?: string;
  source: string;
  targetHandle?: string | null;
  sourceHandle?: string | null;
  animated?: boolean;
  style?: any;
  [key: string]: any;
}

/**
 * 流程图
 */
export interface FlowGraph {
  nodes: NodeInfo[];
  edges: LineInfo[];
}

/**
 * 上下文
 */
export class FlowContext {
  /** 请求ID */
  private requestId: string;
  /** 会话ID */
  private sessionId: string;
  /** 是否取消 */
  private cancelled: boolean = false;
  /** 是否调试 */
  private debug: boolean = false;
  /** 是否内部调用 */
  private internal: boolean = false;
  /** 运行情况 */
  private nodeRunInfo = new Map<
    string,
    {
      // 耗时
      duration: number;
      // 是否成功
      success: boolean;
      // 结果
      result: any;
    }
  >();
  /** 开始时间 */
  private startTime: Date;
  /** 流程结果 */
  private flowResult: any;
  /**
   * 设置流程结果
   * @param flowResult
   */
  setFlowResult(flowResult: any) {
    this.flowResult = flowResult;
  }

  /**
   * 获得流程结果
   * @returns
   */
  getFlowResult(): any {
    return this.flowResult;
  }

  /**
   * 设置是否内部调用
   * @param internal
   */
  setInternal(internal: boolean) {
    this.internal = internal;
  }

  /**
   * 是否内部调用
   * @returns
   */
  isInternal(): boolean {
    return this.internal;
  }

  /**
   * 设置开始时间
   * @param startTime
   */
  setStartTime(startTime: Date) {
    this.startTime = startTime;
  }

  /**
   * 获得开始时间
   * @returns
   */
  getStartTime(): Date {
    return this.startTime;
  }

  /**
   * 设置节点运行情况
   * @param nodeId
   * @param info
   */
  setNodeRunInfo(
    nodeId: string,
    info: { duration: number; success: boolean; result: any }
  ) {
    this.nodeRunInfo.set(nodeId, info);
  }

  /**
   * 获取节点运行情况
   * @param nodeId
   * @returns
   */
  getNodeRunInfo(nodeId: string) {
    return this.nodeRunInfo.get(nodeId);
  }

  isDebug() {
    return this.debug;
  }

  setDebug(debug: boolean) {
    this.debug = debug;
  }

  /** 取消监听 */
  private cancelListeners: (() => void)[] = [];

  /**
   * 设置会话ID
   * @param sessionId
   */
  setSessionId(sessionId: string) {
    this.sessionId = sessionId;
  }

  /**
   * 获得会话ID
   * @returns
   */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * 设置请求ID
   * @param requestId
   */
  setRequestId(requestId: string) {
    this.requestId = requestId;
  }

  /**
   * 获得请求ID
   * @returns
   */
  getRequestId(): string {
    return this.requestId;
  }

  /**
   * 添加取消监听
   * @param listener
   */
  addCancelListener(listener: () => void) {
    this.cancelListeners.push(listener);
  }

  /**
   * 移除取消监听
   * @param listener
   */
  removeCancelListener(listener: () => void) {
    const index = this.cancelListeners.indexOf(listener);
    if (index !== -1) {
      this.cancelListeners.splice(index, 1);
    }
  }

  setCancelled(cancelled: boolean) {
    this.cancelled = cancelled;
    if (cancelled) {
      for (const listener of this.cancelListeners) {
        listener();
      }
    }
  }

  isCancelled(): boolean {
    return this.cancelled;
  }

  // 存储输入输出数据
  private data: FlowContextData = {
    input: new Map(),
    output: new Map(),
    result: new Map(),
  };

  // 请求参数
  private requestParams = {};

  // 调试单个节点
  private debugOne = false;

  // 统计
  private count = {
    // token使用量
    tokenUsage: 0,
  };

  // 执行信息
  private flowNodeExec: FlowNodeExec = {
    current: null,
    prev: null,
    next: null,
    nextList: [],
  };

  // 流程图信息
  private flowGraph: FlowGraph;

  // 是否流式调用
  private stream = false;

  // 流式输出
  streamOutput: (data: {
    isEnd: boolean;
    content: string;
    isThinking: boolean;
    nodeId: string;
  }) => void;

  // 工具输出
  toolOutput: (name: string, type: 'start' | 'end', nodeId: string) => void;

  /**
   * 设置调试单个节点
   * @param debugOne
   */
  setDebugOne(debugOne: boolean): void {
    this.debugOne = debugOne;
  }

  /**
   * 是否调试单个节点
   * @returns
   */
  isDebugOne(): boolean {
    return this.debugOne;
  }

  /**
   * 更新统计
   * @param key
   * @param increment
   */
  updateCount(key: string, increment: number) {
    this.count[key] += increment;
  }

  /**
   * 获取统计
   * @returns
   */
  getCount(): any {
    return this.count;
  }

  /**
   * 设置流式调用
   * @param stream
   */
  setStream(stream: boolean): void {
    this.stream = stream;
  }

  /**
   * 是否流式调用
   * @returns
   */
  isStream(): boolean {
    return this.stream;
  }

  /**
   * 设置请求参数
   * @param params
   */
  setRequestParams(params: any): void {
    this.requestParams = params;
  }

  /**
   * 获得请求参数
   * @returns
   */
  getRequestParams(): any {
    return this.requestParams;
  }

  /**
   * 设置执行信息
   * @param flowNodeExec
   */
  setFlowNodeExec(flowNodeExec: FlowNodeExec): void {
    this.flowNodeExec = flowNodeExec;
  }

  /**
   * 获取执行信息
   * @returns
   */
  getFlowNodeExec(): FlowNodeExec {
    return this.flowNodeExec;
  }

  /**
   * 设置流程图
   * @param flowGraph
   */
  setFlowGraph(flowGraph: FlowGraph): void {
    this.flowGraph = flowGraph;
  }

  /**
   * 获取流程图
   * @returns
   */
  getFlowGraph(): FlowGraph {
    return this.flowGraph;
  }

  /**
   * 设置数据
   * @param key 键
   * @param value 值
   * @param type 类型
   */
  set(
    key: string,
    value: any,
    type: 'input' | 'output' | 'result' = 'input'
  ): void {
    this.data[type].set(key, value);
  }

  /**
   * 获取数据
   * @param key
   * @returns
   */
  get(key: string, type: 'input' | 'output' | 'result' = 'input'): any {
    return this.data[type].get(key);
  }

  /**
   * 获取所有输入数据
   * @returns
   */
  getData(type?: 'input' | 'output'): FlowContextData | Map<string, any> {
    return type ? this.data[type] : this.data;
  }

  /**
   * 销毁，释放所有引用，防止内存泄漏
   */
  destroy() {
    try {
      // 清空取消监听
      this.cancelListeners = [];
      // 清空其它对象引用
      this.requestParams = {};
      this.flowGraph = null;
      this.flowNodeExec = null;
      this.streamOutput = null;
      this.toolOutput = null;
      this.startTime = null;
      this.flowResult = null;
      // 清空数据Map
      this.data.input.clear();
      this.data.output.clear();
      this.data.result.clear();
    } catch (error) {}
  }
}
