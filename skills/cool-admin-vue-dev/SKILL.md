---
name: cool-admin-vue-dev
description: 适用于 cool-admin-vue 8.x 后台模块、CRUD 页面、表单、表格、搜索、插件开发；优先读取模板仓库中 cool-admin-vue 的 .cursorrules 与 .cursor/rules/*.mdc，并按模板风格扩展。
---

# Cool Admin Vue Dev

## 激活条件

- 需求明确属于 `cool-admin-vue`
- 需求涉及后台模块、页面、CRUD、表单、搜索、表格、插件
- 需求提到 `cl-crud`、`@cool-vue/crud`、`src/modules`、`src/plugins`

## 必读顺序

先按这个顺序读取本地规则：

1. `../../cool-admin-vue/.cursorrules`
2. `../../cool-admin-vue/.cursor/rules/dev-defaults.mdc`
3. `../../cool-admin-vue/.cursor/rules/anti-pattern.mdc`
4. `../../cool-admin-vue/.cursor/rules/module.mdc`
5. 按任务类型补读：
   - CRUD 页面：`../../cool-admin-vue/.cursor/rules/crud-template.mdc`、`../../cool-admin-vue/.cursor/rules/crud.mdc`
   - 搜索：`../../cool-admin-vue/.cursor/rules/search-template.mdc`、`../../cool-admin-vue/.cursor/rules/search.mdc`、`../../cool-admin-vue/.cursor/rules/adv-search-template.mdc`、`../../cool-admin-vue/.cursor/rules/adv-search.mdc`
   - 表格：`../../cool-admin-vue/.cursor/rules/table.mdc`
   - 表单或弹窗：`../../cool-admin-vue/.cursor/rules/form-template.mdc`、`../../cool-admin-vue/.cursor/rules/form.mdc`、`../../cool-admin-vue/.cursor/rules/upsert-template.mdc`、`../../cool-admin-vue/.cursor/rules/upsert.mdc`

如果当前项目不是直接沿用模板仓库中的 `cool-admin-vue`，则优先读取当前项目中实际存在的同类模块，再回看模板。
如果当前项目与 `base` 和本地规则都不足以覆盖问题，再回看官方文档 `https://vue.cool-admin.com`。
命名补充规则继续参考 `../cool-project-stack/references/naming-conventions.md`。

## 开发基线

- 默认业务代码优先放在 `src/modules`
- 通用能力或可复用能力再考虑 `src/plugins`
- 开发前优先查找 `src/modules/demo` 中最接近的示例，先沿用 demo 的交互结构与组织方式
- 标准后台管理页面默认优先使用 cool-admin 官方范式：
  - `cl-crud`
  - `cl-table`
  - `cl-search`
  - `cl-adv-search`
  - `cl-upsert`
  - `cl-form`
  - `useCrud`
  - `useTable`
  - `useUpsert`
  - `useSearch`
  - `useAdvSearch`
- 优先复用项目中已有 `service` 与 `useCool()` 能力，不重复封装通用请求流、分页流、弹窗流、表单提交流
- 模块目录优先遵循：
  - `views`
  - `pages`
  - `components`
  - `store`
  - `directives`
  - `hooks`
  - `config.ts`
  - `index.ts`

## 硬性约束

- 文件和组件命名优先使用 `-` 连接，例如 `student-info.vue`
- 变量、函数、响应式状态统一使用 `camelCase`
- 布尔变量优先使用 `is`、`has`、`can`、`should` 前缀
- 路由缓存页面要补 `name`
- 模块路由、组件、事件钩子优先通过 `config.ts` 组织
- 复用现有别名：
  - `/@` -> `src`
  - `/$` -> `src/modules`
  - `/#` -> `src/plugins`
  - `/~` -> `packages`
- 服务类型优先参考 `build/cool/eps.d.ts`
- 优先沿用 `@cool-vue/crud` 的列表、搜索、表单模式，不随意造第二套后台交互体系
- 对于普通后台 CRUD/搜索/弹窗编辑页面，禁止默认手写一整套 `axios/fetch + queryParams + pagination + dialogVisible + formData + submitLoading` 组合
- 能通过 demo、官方文档和现有 `service` 落地的功能，不要退回到通用 Vue 自定义实现
- 不随意修改 `packages`、`src/cool`、基础模块或核心插件，除非当前任务明确要求

## 推荐工作流

### 1. 先找同类页面

优先在以下位置找最接近的现成实现：

- 当前项目 `src/modules`
- `../../cool-admin-vue/src/modules/demo`
- `../../cool-admin-vue/src/modules/base`
- `../../cool-admin-vue/src/plugins`

### 2. 再补前期文档

如果是新模块、新页面流程、多人协作任务，先回到 `../cool-team-docs/SKILL.md`，补需求说明、技术设计、开发实施文档后再编码。

### 3. 再决定页面模式

- 简单列表：优先 `cl-table + cl-pagination`
- 标准后台管理：优先 `cl-crud + cl-upsert + cl-search`
- 高级筛选：再引入 `cl-adv-search`

### 4. 输出要写清楚

- 页面放在哪里
- 模块怎么注册
- 路由怎么接
- 搜索项、表单项、表格列怎么组织
- 为什么选择当前模式

## 文档要求

如果是新模块、复杂页面或多人协作任务，继续读取 `../cool-team-docs/SKILL.md`，至少输出：

- 模块说明
- 页面结构
- 字段说明
- 联调方式
- 测试清单

## 完成标准

- 页面结构与当前项目或 `base` 风格一致
- 没有引入与 cool-admin-vue 冲突的新模式
- CRUD、搜索、表单、表格关系清楚
- 文档能让初级开发者知道“文件放哪里、为什么这样做”
