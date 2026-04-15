# Base 仓库说明

这个目录现在不只是模板代码，还包含了“启动新项目时给 AI 用的规范资产”。

## 目录结构

- `cool-admin-midway/`
  服务端基础模板
- `cool-admin-vue/`
  后台基础模板
- `cool-uni/`
  移动端基础模板
- `skills/`
  团队共用 skill、文档模板、规范入口
- `docs/`
  新人入口、检查清单、长期说明文档

## 新人先看哪里

如果你刚接手这个仓库，先按下面顺序看：

1. `docs/START.md`
   新人最快入口，告诉你先看哪个 skill、怎么开始做事。
2. `skills/cool-project-stack/SKILL.md`
   团队总控规则，告诉 AI 和人应该怎么判断任务、怎么走流程。
3. 按你负责的端继续看：
   - 后端：`skills/cool-admin-midway-dev/SKILL.md`
   - 后台：`skills/cool-admin-vue-dev/SKILL.md`
   - Uni：`skills/cool-uni-dev/SKILL.md`
4. 如果任务不是小修复，还要看：
   - `skills/cool-team-docs/SKILL.md`
   - `skills/cool-project-stack/references/doc-structure.md`

## 团队首次接入

第一次接手这套基座时，不需要一上来把外部 skill 全装完。
先看这份分类说明：

- `skills/cool-project-stack/references/external-skills.md`

接入建议：

1. 先安装“必装”部分
2. 真遇到对应场景，再安装“推荐”或“按需”部分
3. 安装后重启 Codex
4. 如果后续要使用浏览器自动化，再执行 `browser-use doctor`
5. 如果后续要使用 NotebookLM，再按对应 skill 说明完成认证

如果要一次性安装团队默认清单，可以在 `base` 根目录执行：

```bash
bash skills/cool-project-stack/scripts/install-team-skills.sh
```

## 常见任务怎么走

### 1. 小修复

适合：文案、样式、小逻辑、小字段、小接口微调。

做法：

1. 先看 `docs/START.md`
2. 找到对应端的 skill
3. 先看同类代码
4. 改代码
5. 按 `docs/checklists/pre-commit.md` 自检

### 2. 新功能

适合：新页面、新模块、新接口、新流程。

做法：

1. 先看 `docs/START.md`
2. 先走任务分级
3. 补需求 / 技术 / 实施文档
4. 涉及接口就补 API 文档
5. 涉及表结构就补数据库文档
6. 文档齐了再开发

### 3. 跨端任务

做法：

1. 先判断涉及哪些端
2. 默认顺序：`cool-admin-midway` → `cool-uni` → `cool-admin-vue`
3. 先把接口和数据结构定住
4. 再分别推进各端实现
5. 最后统一联调和交付

## 任务分级规则

### L1：小修复

特点：

- 改文案、样式、提示语
- 改一个小判断、小字段、小接口返回处理
- 修一个明确的小 bug
- 不改业务流程，不改表结构，不新增模块

要求：

- 可以直接开发
- 但也要写清楚改了什么
- 提交前做最小自测

### L2：普通功能

特点：

- 新增一个页面、一组表单、一段普通业务逻辑
- 新增或调整接口，但范围可控
- 会影响一个模块里的多个文件

要求：

- 开发前至少补：需求、技术、实施
- 有接口变动，要补 API 文档
- 有数据库变动，要补数据库文档

### L3：复杂功能 / 多人协作任务

特点：

- 新模块、新流程、跨角色流程
- 前后端联动明显
- 多人一起做，或者要分阶段交付
- 影响多个目录、多个页面、多个接口

要求：

- 要补完整开发文档链路
- 至少包括：需求、产品、技术、实施、测试、交付
- 涉及接口必须补 API 文档
- 涉及数据库必须补数据库文档

### L4：系统级 / 跨端 / 高影响任务

特点：

- 跨端任务
- 系统结构调整
- 权限、登录、核心流程、主数据调整
- 影响后端、后台、Uni 中两个及以上端

要求：

- 必须补全套文档
- 必须写清楚端与端之间怎么配合
- 只要有接口变动，必须补 API 文档
- 只要有数据结构或表结构变动，必须补数据库文档
- 交付前必须做联调和交付说明

## 文档放哪里

推荐把文档统一输出到 `docs/`：

- 当前维护的是 `base` 模板仓库时，输出到 `base/docs/`
- 当前维护的是具体业务项目时，输出到项目根目录 `docs/`

推荐采用“长期文档 + 模块文档”结构：

- `docs/README.md`
- `docs/00-system/`
  - `system-overview.md`
  - `system-function-manual.md`
- `docs/01-modules/模块名/`
  - `01-requirements.md`
  - `02-product-design.md`
  - `03-technical-design.md`
  - `04-database.md`
  - `05-api.md`
  - `06-implementation.md`
  - `07-test-checklist.md`
  - `08-delivery.md`

## Skill 入口

团队统一总入口：

- `skills/cool-project-stack/SKILL.md`

子 skill：

- `skills/cool-admin-midway-dev/SKILL.md`
- `skills/cool-admin-vue-dev/SKILL.md`
- `skills/cool-uni-dev/SKILL.md`
- `skills/cool-team-docs/SKILL.md`

## 这套结构解决什么问题

- 新人不用一上来读完整套规范，先看入口就能开工
- 外部 skill 不再默认“全都要装”
- 小修复和新功能的流程被拆开了，不容易乱
- 跨端任务有固定顺序，不容易前后端互相等
- 文档放哪里、什么时候补、补哪些更清楚
- Vue、Midway、Uni 三端各自按自己的规则开发
- `uni` 没有本地规则文件时，也有稳定的兜底规范
- 模块名、表名、字段名、变量名、文件名都有统一参考规范

## 维护建议

- 改模板时，优先同步更新 `skills/` 中对应说明
- 新增公共约定时，优先补到 `skills/cool-project-stack/` 或其 `references/`
- 如果某一端新增了规则文件，记得同步更新对应子 skill 的规则来源说明
- 如果团队新增或替换外部 skill，记得同步更新安装脚本和 `external-skills.md`
- 如果团队调整命名方式，记得同步更新 `skills/cool-project-stack/references/naming-conventions.md`
