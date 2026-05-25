import { Provide, Scope, ScopeEnum } from '@midwayjs/core';
import { FlowNode } from '../../runner/node';
import { FlowContext } from '../../runner/context';
import { FlowResult } from '../../runner/result';

/**
 * JSON抽取
 */
@Provide()
@Scope(ScopeEnum.Prototype)
export class NodeJson extends FlowNode {
  /**
   * 执行
   * @param context
   * @returns
   */
  async run(context: FlowContext): Promise<FlowResult> {
    // 获得输入参数
    const params = this.inputParams;

    const result = this.extractJSONFromText(params.text);

    context.set(`${this.getPrefix()}.json`, result, 'output');

    return {
      success: true,
      result,
    };
  }

  /**
   * 从文本中提取 JSON 字符串并转换为对象
   * @param {string} text - 可能包含 JSON 的文本
   * @returns {Object|Array|null} - 解析出的 JSON 对象，如果没有找到有效 JSON 则返回 null
   */
  extractJSONFromText(text) {
    if (!text || typeof text !== 'string') {
      return null;
    }

    try {
      // 尝试直接解析整个文本
      return JSON.parse(text);
    } catch (e) {
      // 整个文本不是有效的 JSON，尝试提取 JSON 部分
    }

    // 查找可能的 JSON 开始位置（{ 或 [）
    const possibleStarts = [];
    for (let i = 0; i < text.length; i++) {
      if (text[i] === '{' || text[i] === '[') {
        possibleStarts.push(i);
      }
    }

    // 从每个可能的起始位置尝试提取 JSON
    for (const startIndex of possibleStarts) {
      let openBraces = 0;
      let openBrackets = 0;
      let inString = false;
      let escapeNext = false;

      for (let i = startIndex; i < text.length; i++) {
        const char = text[i];

        // 处理转义字符
        if (inString && !escapeNext && char === '\\') {
          escapeNext = true;
          continue;
        }

        // 处理字符串边界
        if (!escapeNext && char === '"') {
          inString = !inString;
        }

        if (!inString) {
          // 只在不在字符串内部时才计算括号
          if (char === '{') openBraces++;
          else if (char === '}') openBraces--;
          else if (char === '[') openBrackets++;
          else if (char === ']') openBrackets--;
        }

        escapeNext = false;

        // 检查是否找到了完整的 JSON 结构
        if (
          (openBraces === 0 && text[startIndex] === '{' && char === '}') ||
          (openBrackets === 0 && text[startIndex] === '[' && char === ']')
        ) {
          const jsonStr = text.substring(startIndex, i + 1);
          try {
            const result = JSON.parse(jsonStr);
            return result;
          } catch (e) {
            // 这个候选 JSON 无效，继续尝试下一个
            break;
          }
        }
      }
    }

    return null; // 没有找到有效的 JSON
  }
}
