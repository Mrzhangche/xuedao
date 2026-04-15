# 团队外部 Skill 安装与调用约定

## 目的

这份文档解决两件事：

- 团队成员第一次接手 `base` 时，先装哪些外部 skill
- 在项目开发过程中，什么场景该装、该用什么 skill

## 安装原则

- 外部 skill 统一安装到个人 AI 环境中，不安装到每个项目仓库
- 项目仓库里的 `base/skills` 负责维护“调用规则”和“落地流程”
- 不要求新人第一次接入就把所有外部 skill 全装完
- 先装最常用的，再按任务补装

## 首次安装方式

如果你想一次性安装团队默认清单，可以在 `base` 根目录执行：

```bash
bash skills/cool-project-stack/scripts/install-team-skills.sh
```

安装完成后：

1. 重启 Codex
2. 如果后续真要用 `browser-use`，再执行 `browser-use doctor`
3. 如果后续真要用 `notebooklm`，再按它自己的说明完成认证与 notebook 配置

## 外部 Skill 分组

### 必装

这几项建议团队成员第一次接手就安装。

| Skill | 安装命令 | 主要作用 |
| --- | --- | --- |
| `find-skills` | `npx skills add vercel-labs/skills@find-skills -g -y` | 搜索和补装其他 skill |
| `planning-with-files` | `npx skills add othmanadi/planning-with-files@planning-with-files -g -y` | 复杂任务、跨端任务、多人协作时做文件化规划 |

### 推荐

不是所有人第一天都必须装，但大部分团队后面会用到。

| Skill | 安装命令 | 主要作用 |
| --- | --- | --- |
| `frontend-design` | `npx skills add anthropics/skills@frontend-design -g -y` | 做高质量前端页面设计 |
| `browser-use` | `npx skills add browser-use/browser-use@browser-use -g -y` | 浏览器自动化、截图、联调、表单验证 |

### 按需

只有遇到对应场景再安装，不要给新人“全都要装”的压力。

| Skill | 安装命令 | 主要作用 |
| --- | --- | --- |
| `ui-ux-pro-max` | `npx skills add nextlevelbuilder/ui-ux-pro-max-skill@ui-ux-pro-max -g -y` | 更强的 UI/UX 视觉打磨、品牌化页面 |
| `notebooklm` | `npx skills add pleaseprompto/notebooklm-skill@notebooklm -g -y` | 知识库研究、资料归纳、来源可追溯问答 |
| `best-minds` | `npx skills add ceeon/best-minds@best-minds -g -y` | 顶级专家视角的产品、架构、策略思考 |

## 常见场景怎么选

| 你现在要做什么 | 先用什么 | 说明 |
| --- | --- | --- |
| 不确定有没有现成 skill，想找一找 | `find-skills` | 先找现成能力，再决定自己写不写 |
| 新功能、跨端任务、多人协作、事情比较长 | `planning-with-files` | 先把计划、分工、进度写清楚 |
| 要做官网、专题页、视觉要求高的前端页面 | `frontend-design` | 重点解决页面不好看、AI 味重 |
| 要做浏览器联调、截图验收、网页多步骤操作 | `browser-use` | 适合真实浏览器流程 |
| 要做强视觉提案、品牌统一感设计 | `ui-ux-pro-max` | 只在高要求设计任务中用 |
| 要读很多资料、知识库、政策文档 | `notebooklm` | 适合研究型任务 |
| 方案卡住，想要更高层视角 | `best-minds` | 适合产品方向、架构方向判断 |

## 与当前基座的配合方式

### 1. 总控 skill 负责判断是否要调用

`cool-project-stack/SKILL.md` 负责把这些 skill 的触发时机写清楚。

### 2. 端内 skill 负责落地实现

- `cool-admin-midway-dev` 负责后端模块实现
- `cool-admin-vue-dev` 负责后台实现
- `cool-uni-dev` 负责移动端实现
- `cool-team-docs` 负责文档输出

### 3. 外部 skill 是增强层，不替代项目规则

- 外部 skill 提供设计、研究、自动化、规划能力
- 项目结构、文件落点、命名规则、文档规则，仍然以 `base/skills` 为准

## 使用边界

- 有现成设计系统和后台风格时，不要默认用 `frontend-design` 或 `ui-ux-pro-max` 重新发明一套视觉语言
- 标准 CRUD、普通表单、简单修复，不强行调用高视觉 skill
- `browser-use` 和 `notebooklm` 都有额外环境准备，不是装完立即无条件可用
- 新增、替换、下线外部 skill 时，必须同时更新这份文档和安装脚本
