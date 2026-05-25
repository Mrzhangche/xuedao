# Agent 接手入口

这份文件给 AI / Agent 使用，用来快速判断当前项目的目录、文档入口和迁移规则。

## 接手顺序

1. 先读项目根目录的 `project.agent.yaml`。
2. 再读 `README.md` 和 `docs/README.md`。
3. 如果是迁移或初始化任务，读 `MIGRATION.md` 和 `skills/cool-project-stack/references/migration.md`。
4. 如果用户只给了一句话迁移需求，读 `docs/00-system/一句话启动新项目迁移提示词.md`，再补齐配置并执行迁移。
5. 如果是功能开发任务，读 `skills/cool-project-stack/SKILL.md`，再按任务端选择对应 skill。

## 动态目录规则

不要假设新项目一定使用 base 的目录名。所有项目目录以 `project.agent.yaml` 为准：

- 后端目录：`paths.backend`
- 后台目录：`paths.admin`
- 移动端目录：`paths.mobile`
- 文档目录：`paths.docs`
- skill 目录：`paths.skills`

如果 `project.agent.yaml` 不存在，先使用 `project.agent.template.yaml` 创建配置，再继续迁移或开发。

## 多 Agent 分工

复杂迁移建议至少拆成三个角色：

- 迁移执行 agent：负责 dry-run、复制、占位符替换、冲突处理。
- 文档审查 agent：负责检查 README、docs、skills、AGENTS 的入口是否一致。
- 适配审查 agent：负责扫描写死路径、base 残留、目录映射和项目差异。

所有 agent 都必须围绕同一份 `project.agent.yaml` 工作，不要各自猜目录。

## 禁止事项

- 不要直接全局替换所有 `base` 字样。
- 不要覆盖新项目已有 README、docs、AGENTS，除非迁移报告确认允许覆盖。
- 不要把业务项目名、绝对路径、数据库实例、部署地址写进 base 的通用 skill。
- 不要绕过 `docs/README.md` 直接在全仓库里盲扫。

## 迁移完成后

迁移完成后必须检查：

- `migration-report.md`
- `docs/00-system/迁移后自检清单.md`
- 新项目自己的 `project.agent.yaml`
- 新项目自己的 `docs/00-system/项目与base差异记录.md`
