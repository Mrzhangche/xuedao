import { CoolCommException } from '@cool-midway/core';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { AIMessage, HumanMessage } from '@langchain/core/messages';
import {
  ChatPromptTemplate,
  PromptTemplate,
  DEFAULT_PARSER_MAPPING,
  DEFAULT_FORMATTER_MAPPING,
} from '@langchain/core/prompts';
import { IterableReadableStream } from '@langchain/core/utils/stream';
import { ILogger, Inject, Provide, Scope, ScopeEnum } from '@midwayjs/core';
import { FlowContext } from '../../runner/context';
import { FlowNode } from '../../runner/node';
import { FlowStream } from '../../runner/stream';
import { FlowConfigService } from '../../service/config';
import { FlowDataService } from '../../service/data';
import { NodeLLMModel } from './model';
import { customParseFString, interpolateFString } from './parse';
import { NodeTool } from '../tools';
import { createAgent } from 'langchain';
import * as _ from 'lodash';
import { FlowLogService } from '../../service/log';
import { NodeMCP } from '../mcp';
import { MultiServerMCPClient } from '@langchain/mcp-adapters';
import { KnowMultiLoader } from '../../../know/loader/multi';
import * as path from 'path';
import * as os from 'os';
DEFAULT_PARSER_MAPPING['f-string'] = customParseFString;
DEFAULT_FORMATTER_MAPPING['f-string'] = interpolateFString;

// 消息体
interface Message {
  // 角色
  role: 'system' | 'user' | 'assistant' | 'placeholder';
  // 内容
  content: any;
}

/**
 * LLM大模型节点
 */
@Provide()
@Scope(ScopeEnum.Prototype)
export class NodeLLM extends FlowNode {
  @Inject()
  nodeLLMModel: NodeLLMModel;

  @Inject()
  nodeTool: NodeTool;

  @Inject()
  nodeMCP: NodeMCP;

  @Inject()
  flowConfigService: FlowConfigService;

  @Inject()
  flowDataService: FlowDataService;

  @Inject()
  flowLogService: FlowLogService;

  @Inject()
  knowMultiLoader: KnowMultiLoader;

  @Inject()
  logger: ILogger;

  /**
   * 执行
   * @param context
   */
  async run(context: FlowContext) {
    let { model, messages, history, isOutput, toolConfig, mcpConfig } =
      this.config.options;
    const config = await this.flowConfigService.getOptions(model.configId);
    let llm = await this.getModel(model.supplier, {
      ...model.params,
      ...config.comm,
    });
    const params = this.inputParams;
    const prompt = await this.getPrompt(messages, context, params, history);
    let chain,
      isTool = false,
      agentInput;
    // 创建工具名称到MCP配置名称的映射
    const toolNameToMcpName = new Map<string, string>();
    if (llm['bindTools'] && (toolConfig?.length || mcpConfig?.length)) {
      isTool = true;
      const tools = await this.getTools(toolConfig);
      // 获取MCP工具，同时构建映射关系
      const mcpTools = await this.getMcpTools(mcpConfig, toolNameToMcpName);
      tools.push(...mcpTools);
      // 使用新的 createAgent API
      chain = createAgent({
        model: llm,
        tools,
      });
      // 将提示转换为消息格式
      const formattedMessages = await prompt.invoke(params);
      agentInput = { messages: formattedMessages.messages };
    } else {
      chain = prompt.pipe(llm);
      agentInput = params;
    }
    let stream: FlowStream = new FlowStream();
    let res;
    let text = '';
    if (context.isStream()) {
      const _stream: IterableReadableStream<any> = await (isTool
        ? chain.streamEvents(agentInput, { version: 'v2' })
        : chain.stream(agentInput));
      const content = [];
      const save = async () => {
        let toolNames = [];
        // 处理流式输出的通用函数
        const handleStreamOutput = (chunk: any) => {
          const text = chunk.content;
          const thinking = chunk.additional_kwargs?.reasoning_content;
          if (thinking && isOutput) {
            context.streamOutput({
              isEnd: false,
              content: thinking,
              isThinking: true,
              nodeId: this.id,
            });
          }
          if (text) {
            if (toolNames.length > 0) {
              for (const toolName of toolNames) {
                context.toolOutput &&
                  context.toolOutput(toolName, 'end', this.id);
              }
              toolNames = [];
            }
            content.push(text);
            stream.push(text);
            if (isOutput) {
              context.streamOutput({
                isEnd: false,
                content: text,
                isThinking: false,
                nodeId: this.id,
              });
            }
          }
        };
        // 流式输出
        for await (const chunk of _stream) {
          const { event, data } = chunk;
          if (chunk.usage_metadata?.total_tokens) {
            context.updateCount(
              'tokenUsage',
              chunk.usage_metadata?.total_tokens || 0
            );
          }
          if (event == 'on_parser_end') {
            context.updateCount(
              'tokenUsage',
              data?.input?.usage_metadata?.total_tokens || 0
            );
          }
          if (isTool) {
            // 工具调用开始
            if (event == 'on_tool_start') {
              if (!toolNames.includes(chunk.name)) {
                toolNames.push(chunk.name);
              }
              // 通过工具名称获取MCP配置名称
              const mcpName = toolNameToMcpName.get(chunk.name) || chunk.name;
              context.toolOutput &&
                context.toolOutput(mcpName, 'start', this.id);
            }
            // 工具调用结束
            if (event == 'on_tool_end') {
              // 去除toolNames中的chunk.name
              toolNames = toolNames.filter(item => item !== chunk.name);
              // 通过工具名称获取MCP配置名称
              const mcpName = toolNameToMcpName.get(chunk.name) || chunk.name;
              context.toolOutput && context.toolOutput(mcpName, 'end', this.id);
            }
            // LLM流式输出
            if (event === 'on_chat_model_stream' && data?.chunk) {
              handleStreamOutput(data.chunk);
            }
          } else {
            handleStreamOutput(chunk);
          }
        }
        stream.push(null);
        // 保存历史
        text = content.join('');
        this.saveHistory(messages, context, history, text, prompt);
        context.streamOutput({
          isEnd: true,
          content: '',
          isThinking: false,
          nodeId: this.id,
        });
        context.set(`${this.getPrefix()}.text`, text, 'output');
      };
      await save();
    } else {
      res = await chain.invoke(agentInput);

      // 保存历史
      const responseContent = isTool
        ? res?.messages?.[res.messages.length - 1]?.content || ''
        : res?.content;
      this.saveHistory(messages, context, history, responseContent, prompt);
      text = responseContent;
    }
    context.set(`${this.getPrefix()}.text`, text, 'output');
    context.set(`${this.getPrefix()}.stream`, stream, 'output');
    context.updateCount(
      'tokenUsage',
      res?.response_metadata?.tokenUsage?.totalTokens || 0
    );
    return {
      success: true,
      // stream,
      result: {
        text: text || res?.content,
      },
    };
  }

  /**
   * 获得提示模板
   * @param messages
   * @returns
   */
  async getPrompt(
    messages: Message[],
    context: FlowContext,
    params: any,
    history = 0
  ): Promise<ChatPromptTemplate> {
    const type = {
      system: 'system',
      user: 'human',
      placeholder: 'placeholder',
      assistant: 'ai',
    };
    const imageMessage = await this.getImageMessage();
    const fileContent = await this.getFileContent();
    params['fileContent'] = fileContent;
    let prompt;
    if (history) {
      const objectId = context.getSessionId();
      if (!objectId) {
        throw new CoolCommException(
          '需要保存历史信息，请求参数必须包含sessionId'
        );
      }
      // 取出历史
      const historyMessages =
        (await this.flowDataService.get(this.flowId, objectId)) || [];
      prompt = ChatPromptTemplate.fromMessages([
        [type[messages[0].role], messages[0].content],
        ['placeholder', '{chat_history}'],
        // @ts-ignore
        ...messages
          .filter(item => item.role != 'system')
          .map(item => {
            if (item.role == 'user' && !_.isEmpty(imageMessage)) {
              return new HumanMessage({
                content: [
                  {
                    type: 'text',
                    text: item.content + '{fileContent}',
                  },
                  ...imageMessage,
                ],
              });
            }
            return [type[item.role], item.content + '{fileContent}'];
          }),
        // @ts-ignore
        ['placeholder', '{agent_scratchpad}'],
      ]);
      params['chat_history'] = historyMessages.map(item => {
        return item.role == 'user'
          ? new HumanMessage({ content: item.content })
          : new AIMessage({ content: item.content });
        // : new HumanMessage({
        //     content: [
        //       {
        //         type: 'text',
        //         text: item.content,
        //       },
        //       ...imageMessage,
        //     ],
        //   })
      });
    } else {
      const _messages: any[] = messages.map(item => {
        if (item.role == 'user' && !_.isEmpty(imageMessage)) {
          return new HumanMessage({
            content: [
              {
                type: 'text',
                text: item.content + '{fileContent}',
              },
              ...imageMessage,
            ],
          });
        }
        return [type[item.role], item.content + '{fileContent}'];
      });

      _messages.push(['placeholder', '{agent_scratchpad}']);
      prompt = ChatPromptTemplate.fromMessages(_messages);
    }
    return prompt;
  }

  /**
   * 获得文件消息
   * @returns
   */
  async getFileContent() {
    const fileParams = this.fileParams;
    if (_.isEmpty(fileParams)) return '';
    const gets = [];
    const fileContent = async (url: string) => {
      const download = require('download');
      const fs = require('fs');
      const crypto = require('crypto');

      // 从URL中获取文件扩展名
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const ext = path.extname(pathname) || '.txt';

      // 创建临时文件名
      const tempFileName = path.join(
        os.tmpdir(),
        `${crypto.randomBytes(6).toString('hex')}${ext}`
      );

      try {
        // 下载文件到临时目录
        const data = await download(encodeURI(url));
        fs.writeFileSync(tempFileName, data);

        // 加载文件内容
        const docs = await this.knowMultiLoader.load(tempFileName);
        return docs.map(item => item.pageContent)[0];
      } finally {
        // 删除临时文件
        if (fs.existsSync(tempFileName)) {
          fs.unlinkSync(tempFileName);
        }
      }
    };
    Object.keys(fileParams).forEach(key => {
      for (const url of fileParams[key]) {
        gets.push(fileContent(url));
      }
    });
    const fileContents = await Promise.all(gets);
    return (
      `uploaded document content(ignore if empty or invalid): ` +
      fileContents.map((item, index) => `${index}. ${item}`).join(`\n\n`)
    );
  }

  /**
   * 获得图片消息
   * @returns
   */
  async getImageMessage() {
    const imageParams = this.imageParams;
    if (_.isEmpty(imageParams)) return [];
    const toBase64 = async (url: string) => {
      const download = require('download');
      const data = await download(
        url !== decodeURIComponent(url) ? url : encodeURI(url)
      );
      return Buffer.from(data).toString('base64');
    };
    const gets = [];
    Object.keys(imageParams).forEach(async key => {
      for (const url of imageParams[key]) {
        gets.push(toBase64(url));
      }
    });
    const data = await Promise.all(gets);
    return data.map(item => {
      return {
        type: 'image_url',
        image_url: {
          url: `data:image/png;base64,${item}`,
        },
      };
    });
  }

  /**
   * 保存历史
   * @param messages
   * @param context
   * @param objectId
   */
  async saveHistory(
    messages: Message[],
    context: FlowContext,
    history = 0,
    newContent: string,
    prompt: ChatPromptTemplate
  ) {
    const params = this.inputParams;
    const objectId = context.getSessionId();
    if (!objectId || !history) return;

    const historyMessages =
      (await this.flowDataService.get(this.flowId, objectId)) || [];
    const lastMessage = messages.filter(item => item.role === 'user').pop();
    const userContent = await PromptTemplate.fromTemplate(
      lastMessage.content
    ).invoke(params);
    const userMessage = {
      role: 'user',
      content: userContent.value,
    };
    const newMessages = historyMessages
      .concat(userMessage)
      .concat({ role: 'assistant', content: newContent });

    const totalLength = newMessages.length;
    if (totalLength > history) {
      newMessages.splice(0, totalLength - history);
    }

    await this.flowDataService.set(this.flowId, objectId, newMessages);
  }

  /**
   * 获得模型
   * @param name 名称
   * @param options 配置
   * @returns
   */
  async getModel(name: string, options: any): Promise<BaseChatModel> {
    const LLM = await this.nodeLLMModel.getModel(name);

    // 创建自定义 fetch 函数，用于在请求体中添加 provider 参数
    const customFetch = async (url: string, init?: RequestInit) => {
      if (init?.body && typeof init.body === 'string') {
        try {
          const body = JSON.parse(init.body);
          body.provider = {
            sort: 'latency',
          };
          init.body = JSON.stringify(body);
        } catch (e) {}
      }
      return fetch(url, init);
    };

    // 配置自定义 fetch 函数
    options.configuration = {
      ...options.configuration,
      fetch: customFetch,
    };

    // @ts-ignore
    return new LLM(options);
  }

  /**
   * 获得工具
   * @param toolConfig
   * @returns
   */
  async getTools(
    toolConfig: { id: number; key: string; options: any }[]
  ): Promise<any> {
    const tools = [];
    for (const item of toolConfig) {
      const config = await this.flowConfigService.getOptions(item.id);
      const tool: any = await this.nodeTool.getTool(item.key);
      tools.push(
        tool({
          ...config,
          ...item.options,
        })
      );
    }
    return tools;
  }

  /**
   * 获得MCP工具
   * @param mcpConfig
   * @param toolNameMap 工具名称到MCP配置名称的映射
   * @returns
   */
  async getMcpTools(
    mcpConfig: { id: number; key: string; options: any }[],
    toolNameMap: Map<string, string>
  ): Promise<any> {
    const tools = [];
    if (!mcpConfig) return tools;
    for (const item of mcpConfig) {
      const config = await this.flowConfigService.getConfig(item.id);
      const client: MultiServerMCPClient = await this.nodeMCP.getMCP(
        config.name
      );
      // 获取所有工具（headers已在初始化时配置）
      const _tools = await client.getTools();
      // 构建工具名称到MCP配置名称的映射
      _tools.forEach(tool => {
        toolNameMap.set(tool.name, config.name);
      });
      tools.push(..._tools);
    }
    return tools;
  }
}
