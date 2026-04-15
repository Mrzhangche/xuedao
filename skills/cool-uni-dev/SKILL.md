---
name: cool-uni-dev
description: 适用于 cool-uni 页面、路由、接口接入、状态流转、移动端模块开发；在缺少本地规则文件时，优先依据当前项目代码、cool-uni 模板、官方文档和团队级参考进行兜底。
---

# Cool Uni Dev

## 激活条件

- 需求明确属于 `cool-uni`
- 需求涉及 Uni 页面、移动端流程、路由、接口接入、tabbar、登录、我的页面、列表页
- 需求提到 `pages.json`、`useCool`、`cool-ui`、`uni-app`

## 规范来源顺序

`cool-uni` 当前没有像 Vue / Midway 那样的本地 `.cursor/rules`，所以必须按这个顺序执行：

1. 用户当前要求
2. 当前项目已有代码结构和页面模式
3. `../../cool-uni`
4. 官方文档 `https://uni-docs.cool-js.com`
5. 团队参考 `../cool-project-stack/references/base-repo-conventions.md`
6. 通用最佳实践

不要因为缺少规则文件就自由发挥。
命名补充规则继续参考 `../cool-project-stack/references/naming-conventions.md`。

## 必看目录

优先参考这些位置：

- `../../cool-uni/config`
- `../../cool-uni/pages`
- `../../cool-uni/router`
- `../../cool-uni/cool`
- `../../cool-uni/components`
- `../../cool-uni/locale`
- `../../cool-uni/uni_modules/cool-ui`

## 开发基线

- 页面优先放在 `pages/*`
- 全局配置优先放在 `config/*.ts`
- 页面注册与入口信息优先保持 `pages.json`、`router/index.ts` 一致
- 路由能力优先沿用 `router/index.ts`
- 通用能力优先复用 `cool/*`
- 通用组件优先放在 `components/*`
- UI 优先使用 `cool-ui`

## 硬性约束

- 不引入和当前项目风格冲突的 UI 框架
- 不自创第二套路由或请求体系，优先复用 `useCool`、现有 `service`、现有 `router`
- 页面文件优先使用 `kebab-case`，变量和函数统一使用 `camelCase`
- 布尔变量优先使用 `is`、`has`、`can`、`should` 前缀
- 写页面前先确认页面入口、路由、接口、空状态、加载状态
- 如果是列表页，先确定分页、筛选、下拉刷新、触底加载怎么处理
- 如果是个人中心或业务流程页，先确定状态流转与登录态依赖

## 推荐工作流

### 1. 先找最接近的页面

优先查看：

- `../../cool-uni/pages/index`
- `../../cool-uni/pages/user`
- `../../cool-uni/pages/demo`

### 2. 先补前期文档

如果是新页面、新流程、多人协作任务，先回到 `../cool-team-docs/SKILL.md`，补需求说明、技术设计、开发实施文档；如果要新增接口联调说明，也要先把接口与数据结构说明写清楚。

### 3. 再确认接口接入方式

优先复用当前项目已经存在的服务调用方式，不要手写一套孤立请求逻辑。

### 4. 再补界面状态

至少考虑：

- 初始加载
- 空数据
- 接口失败
- 加载中
- 登录态缺失

## 文档要求

只要是新页面、新流程或需要多人协作，就继续读取 `../cool-team-docs/SKILL.md`，至少输出：

- 页面路径
- 入口说明
- 接口接入说明
- 状态流转说明
- 测试清单

## 完成标准

- 页面和路由落点清楚
- 接口接入方式与当前项目或 `base` 一致
- 没有混入其他移动端 UI 框架习惯
- 文档能让初级开发者知道“页面放哪里、怎么接接口、怎么验收”
