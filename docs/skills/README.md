# Skills 说明

这个目录说明 `skills/` 的维护边界。它不是执行入口；执行入口仍然是各个 `SKILL.md`。

## 目录职责

- `skills/cool-project-stack/`：任务总控、分级、阶段化流程、规范优先级、迁移规则入口。
- `skills/cool-team-docs/`：进入文档流后的文档组织、模板、命名、执行卡。
- `skills/cool-admin-midway-dev/`：后端开发规则。
- `skills/cool-admin-vue-dev/`：后台开发规则。
- `skills/cool-uni-dev/`：Uni / 移动端开发规则。

## 维护原则

- 执行规则写进 skill。
- 面向人的阅读路径写进 `README.md` 和 `docs/README.md`。
- AI 接手协议写进 `AGENTS.md`。
- 项目专属值写进 `project.agent.yaml`，不要写死进 skill。
- 示例可以保留，但必须标注为示例，不能变成默认业务规则。
- 迁移相关规则优先集中在 `skills/cool-project-stack/references/migration.md`。

## 什么时候改 skill

- 任务分级、阶段化流程、文档流规则变化：改 `cool-project-stack`。
- 文档目录、命名、模板、执行卡规则变化：改 `cool-team-docs`。
- 某一端框架规则、目录规则、禁止事项变化：改对应端 skill。
- 迁移变量、目录映射、迁移后检查变化：优先改迁移文档和 `migration.md`，再在总控 skill 中补引用。
