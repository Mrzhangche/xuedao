export const customParseFString = (template: string) => {
  const chars = template.split('');
  const nodes = [];
  const nextBracket = (bracket: string, start: number) => {
    for (let i = start; i < chars.length; i += 1) {
      if (bracket.includes(chars[i])) {
        return i;
      }
    }
    return -1;
  };

  const isSimpleVariable = (content: string) => {
    // 检查是否为简单变量名（仅限字母、数字、下划线）
    // 并且不包含任何空格、引号、特殊字符
    return (
      /^[a-zA-Z0-9_]+$/.test(content) &&
      !content.includes('\n') &&
      !content.includes('"') &&
      !content.includes("'") &&
      !content.includes(':') &&
      !content.includes('{') &&
      !content.includes('}')
    );
  };

  let i = 0;
  while (i < chars.length) {
    if (chars[i] === '{' && i + 1 < chars.length && chars[i + 1] === '{') {
      nodes.push({ type: 'literal', text: '{' });
      i += 2;
    } else if (
      chars[i] === '}' &&
      i + 1 < chars.length &&
      chars[i + 1] === '}'
    ) {
      nodes.push({ type: 'literal', text: '}' });
      i += 2;
    } else if (chars[i] === '{') {
      const j = nextBracket('}', i);
      if (j < 0) {
        throw new Error("Unclosed '{' in template.");
      }
      const content = chars.slice(i + 1, j).join('');

      if (isSimpleVariable(content)) {
        nodes.push({
          type: 'variable',
          name: content,
        });
      } else {
        // 如果它不是一个简单的变量，则将其视为文字
        nodes.push({ type: 'literal', text: '{' + content + '}' });
      }
      i = j + 1;
    } else if (chars[i] === '}') {
      throw new Error("Single '}' in template.");
    } else {
      const next = nextBracket('{}', i);
      const text = (next < 0 ? chars.slice(i) : chars.slice(i, next)).join('');
      nodes.push({ type: 'literal', text });
      i = next < 0 ? chars.length : next;
    }
  }
  return nodes;
};

export const interpolateFString = (template: string, values: any) =>
  customParseFString(template).reduce((res, node) => {
    if (node.type === 'variable') {
      if (node.name in values) {
        return res + values[node.name];
      }
      throw new Error(`(f-string) Missing value for input ${node.name}`);
    }

    return res + node.text;
  }, '');
