# base 迁移到新项目怎么做

这份文档用于把当前 base 中的 `skills/`、`docs/`、`README.md`、`AGENTS.md` 快速迁移到一个新项目。

目标不是复制完就结束，而是让新项目马上拥有清晰的 AI 接手入口、文档入口和阶段化开发规则。

如果你想让 AI 通过一句话完成整套迁移，直接复制：

- `docs/00-system/一句话启动新项目迁移提示词.md`

## 迁移前准备

先确认新项目的真实目录：

- 后端目录：
- 后台目录：
- 移动端目录：
- 文档目录：
- Skill 目录：
- 数据库类型：
- 技术基线名称：
- 示例业务模块：

不要默认新项目一定继续使用 `cool-admin-midway`、`cool-admin-vue`、`cool-uni` 作为目录名。

## 第一步：填写变量表

复制 `project.agent.template.yaml` 为新项目根目录下的：

```text
project.agent.yaml
```

至少填写：

- `PROJECT_NAME`
- `PROJECT_CODE`
- `PROJECT_ROOT`
- `BASE_REPO`
- `BACKEND_DIR`
- `ADMIN_DIR`
- `MOBILE_DIR`
- `DOCS_DIR`
- `SKILLS_DIR`
- `BASELINE_NAME`
- `DATABASE_TYPE`
- `EXAMPLE_MODULE`

如果暂时没有某一端，把对应 `roles.*.enabled` 设为 `false`，不要留空让 AI 猜。

## 第二步：复制迁移资产

默认迁移这些内容：

```text
skills/
docs/
README.md
AGENTS.md
```

`README.md` 是特殊资产：可以先复制成参考，但新项目正式 README 应保留自己的启动方式、部署方式和业务说明，必要时用 `skills/cool-project-stack/templates/project-bootstrap-readme-template.md` 重写。

如果目标项目已经有同名文件，不要直接覆盖。先备份或生成迁移报告，让人工确认如何合并。

## 第三步：替换占位符

迁移资产中允许出现这些占位符：

```text
{{PROJECT_NAME}}
{{PROJECT_CODE}}
{{PROJECT_DESCRIPTION}}
{{PROJECT_ROOT}}
{{BASE_REPO}}
{{BASELINE_NAME}}
{{DOCS_DIR}}
{{SKILLS_DIR}}
{{BACKEND_DIR}}
{{ADMIN_DIR}}
{{MOBILE_DIR}}
{{DATABASE_TYPE}}
{{EXAMPLE_MODULE}}
{{MODULE_DOC_STYLE}}
```

脚本只替换占位符，不负责猜业务含义。

## 第四步：修入口

迁移后至少确认这些文件存在：

- `README.md`
- `AGENTS.md`
- `docs/README.md`
- `skills/cool-project-stack/SKILL.md`

职责分工：

- `README.md`：给人看，说明项目结构、启动方式、文档入口、skill 入口。
- `AGENTS.md`：给 AI / Agent 看，说明接手顺序和目录映射。
- `docs/README.md`：文档路由，说明不同场景该看哪份文档。
- `skills/cool-project-stack/SKILL.md`：任务分级、文档流、阶段化协作总控。

## 第五步：检查相对路径

重点检查：

- 后端 skill 是否指向真实后端目录
- 后台 skill 是否指向真实后台目录
- Uni skill 是否指向真实移动端目录
- `.cursor/rules` 中不存在的文件是否标注“如存在”
- `docs/README.md` 是否引用真实存在的文档
- 根 `README.md` 是否保留了新项目已有运行方式

## 第六步：运行自检

迁移完成后看：

- `docs/00-system/迁移后自检清单.md`

自检重点：

- 是否残留旧项目名
- 是否残留旧业务示例
- 是否残留本机绝对路径
- 是否把 `src/modules/base`、`BaseService` 误替换
- 是否有不存在的 skill 路径
