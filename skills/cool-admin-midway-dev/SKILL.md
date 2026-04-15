---
name: cool-admin-midway-dev
description: 适用于 cool-admin-midway 8.x 模块、实体、控制器、服务、事件、任务开发；优先读取模板仓库中 cool-admin-midway 的 .cursorrules 与 .cursor/rules/*.mdc，并按模块化方式实现。
---

# Cool Admin Midway Dev

## 激活条件

- 需求明确属于 `cool-admin-midway`
- 需求涉及实体、接口、服务、模块、事件、任务、缓存、权限
- 需求提到 `src/modules`、`@CoolController`、`TypeORM`、`Midway`

## 必读顺序

先按这个顺序读取本地规则：

1. `../../cool-admin-midway/.cursorrules`
2. `../../cool-admin-midway/.cursor/rules/module.mdc`
3. 按任务类型补读：
   - Controller：`../../cool-admin-midway/.cursor/rules/controller.mdc`
   - Service：`../../cool-admin-midway/.cursor/rules/service.mdc`
   - Entity / db.json：`../../cool-admin-midway/.cursor/rules/db.mdc`
   - 异步事件：`../../cool-admin-midway/.cursor/rules/event.mdc`
   - 权限：`../../cool-admin-midway/.cursor/rules/authority.mdc`
   - 定时任务：`../../cool-admin-midway/.cursor/rules/task.mdc`
   - 缓存：`../../cool-admin-midway/.cursor/rules/cache.mdc`
   - 多租户：`../../cool-admin-midway/.cursor/rules/tenant.mdc`
   - Socket：`../../cool-admin-midway/.cursor/rules/socket.mdc`

如果当前项目已有同类模块，先看当前模块，再看 `base`。
如果当前项目与 `base` 和本地规则都不足以覆盖问题，再回看官方文档 `https://node.cool-admin.com`。
命名补充规则继续参考 `../cool-project-stack/references/naming-conventions.md`。

## 模块基线

默认模块目录：

- `controller`
- `entity`
- `service`
- `dto`
- `middleware`
- `schedule`
- `config.ts`
- `db.json`
- `menu.json`

最常见的新模块最少要有：

- `config.ts`
- `entity`
- `controller`
- `service`

## 硬性约束

- 始终使用中文回复与中文注释
- 使用 `@midwayjs/core`，不要使用 `@midwayjs/decorator`
- Controller 不加 `@Provide()`
- Entity 不使用 `@ManyToOne`、`@OneToMany` 等外键关系写法
- Entity 字段使用驼峰命名
- 数据库表名使用 `snake_case`，数据库字段与 Entity 字段统一使用 `camelCase`
- 文件命名遵循当前项目与规则文件约定，不擅自改成另一套风格
- 优先使用 TypeORM API，不用自定义 SQL 处理普通增删改查
- `Controller` 不重写 `add`、`delete`、`update`、`info`、`list`、`page`
- 列表或分页联表优先考虑 `pageQueryOp` / `listQueryOp`
- Controller 与 Service 的函数上方写清楚用途

## 推荐工作流

### 1. 先找同类模块

优先从以下位置找样板：

- 当前项目 `src/modules`
- `../../cool-admin-midway/src/modules/base`
- `../../cool-admin-midway/src/modules/demo`

### 2. 先补前期文档

如果是新模块、新接口、字段调整、多人协作任务，先回到 `../cool-team-docs/SKILL.md`，补需求说明、技术设计、开发实施文档；如果有表结构变化，再先补数据库设计文档。

### 3. 先定边界再写代码

先说明：

- 标准 CRUD 是否足够
- 哪些接口用标准 CRUD
- 哪些接口必须自定义
- Service 负责什么
- Controller 负责什么

### 4. 事件与异步

跨模块通知、解耦场景优先考虑 `event`，不要把所有逻辑硬塞进单个 Service。

## 文档要求

中等及以上复杂度任务继续读取 `../cool-team-docs/SKILL.md`，至少输出：

- 模块职责
- 实体字段说明
- 接口说明
- 业务规则
- 联调步骤

## 完成标准

- 模块结构与当前项目或 `base` 一致
- 标准 CRUD 与自定义接口边界清晰
- 实体、控制器、服务各司其职
- 注释和文档足够让初级开发者接着维护
