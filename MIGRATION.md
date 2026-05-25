# Base 迁移入口

这份文档是把当前 base 迁移到新项目时的最短入口。

base 现在包含三类资产：

- 三端模板：`cool-admin-midway`、`cool-admin-vue`、`cool-uni`
- AI / 团队规范：`skills/`
- 项目协作文档：`docs/`

新项目不一定要完整复制三端代码，但通常应该迁移 `skills/`、`docs/`、`README.md`、`AGENTS.md` 这一组规范资产。

## 推荐迁移顺序

1. 在新项目根目录创建 `project.agent.yaml`
2. 按 `project.agent.template.yaml` 填写项目名、目录映射、数据库类型、示例模块
3. 运行迁移脚本的 dry-run
4. 查看迁移报告中的冲突和残留项
5. 确认无误后用 `--write` 执行迁移
6. 按 `docs/00-system/迁移后自检清单.md` 做人工复核

## 一句话让 AI 迁移

如果你想让 AI 直接完成整套迁移，复制这份提示词：

- `docs/00-system/一句话启动新项目迁移提示词.md`

## 推荐命令

先预览：

```bash
node scripts/migrate-to-project.mjs --config /path/to/new-project/project.agent.yaml
```

确认后写入：

```bash
node scripts/migrate-to-project.mjs --config /path/to/new-project/project.agent.yaml --write
```

## 关键文档

- `project.agent.template.yaml`：新项目迁移配置模板
- `AGENTS.md`：AI / Agent 接手入口
- `docs/00-system/base迁移到新项目怎么做.md`：完整迁移步骤
- `docs/00-system/迁移变量表模板.md`：迁移变量说明
- `docs/00-system/一句话启动新项目迁移提示词.md`：可直接复制给 AI 的迁移提示词
- `docs/00-system/迁移后自检清单.md`：迁移后检查
- `docs/00-system/base资产边界说明.md`：哪些内容能迁移、哪些必须项目化
- `skills/cool-project-stack/references/migration.md`：给 AI 用的迁移执行规则

## 注意事项

- 不要把所有 `base` 字样直接全局替换。
- 不要覆盖新项目已有 README、docs、AGENTS，除非已经确认合并方式。
- `src/modules/base`、`BaseService`、官方文档链接不是迁移变量。
- 三端目录名以新项目 `project.agent.yaml` 为准。
