import { NodeCode } from './code';
import { NodeEnd } from './end';
import { NodeJudge } from './judge';
import { NodeLLM } from './llm';
import { ConfigLLM } from './llm/config';
import { NodeClassify } from './classify';
import { NodeStart } from './start';
import { NodeKnow } from './know';
import { NodeFlow } from './flow';
import { NodeParse } from './parse';
import { NodeVariable } from './variable';
import { ConfigTOOL } from './tools/config';
import { ConfigMCP } from './mcp/config';
import { NodeJson } from './json';

/**
 * 节点类型
 */
export const NodeType = {
  // 开始节点
  start: NodeStart,
  // LLM大模型
  llm: NodeLLM,
  // code 代码执行器节点
  code: NodeCode,
  // 判断器
  judge: NodeJudge,
  // 分类
  classify: NodeClassify,
  // 知识库
  know: NodeKnow,
  // 流程
  flow: NodeFlow,
  // 智能解析
  parse: NodeParse,
  // 变量
  variable: NodeVariable,
  // JSON
  json: NodeJson,
  // 结束节点
  end: NodeEnd,
};

// 节点类型键
export type NodeTypeKey = keyof typeof NodeType;

// 节点配置
export const FlowNodeConfig = {
  // LLM大模型
  llm: ConfigLLM,
  // 工具
  tool: ConfigTOOL,
  // MCP
  mcp: ConfigMCP,
};

// 节点配置
export const FlowAllConfig = [
  {
    title: '大模型LLM',
    type: 'llm',
  },
  {
    title: '工具TOOL',
    type: 'tool',
  },
  {
    title: '功能MCP',
    type: 'mcp',
  },
];
