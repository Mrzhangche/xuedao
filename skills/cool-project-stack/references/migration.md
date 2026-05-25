# Base 迁移执行规则

这份文件给 AI 使用。只有在用户要求迁移 base 资产、初始化新项目文档、同步 `skills/` / `docs/` / `README.md` / `AGENTS.md` 时读取。

## 先读配置

迁移前先找：

1. 新项目根目录 `project.agent.yaml`
2. 如果没有，则读取 base 的 `project.agent.template.yaml`
3. 如果仍没有，先要求补齐变量，不要直接猜目录

至少确认：

- `PROJECT_NAME`
- `BASE_REPO`
- `BACKEND_DIR`
- `ADMIN_DIR`
- `MOBILE_DIR`
- `DOCS_DIR`
- `SKILLS_DIR`
- `BASELINE_NAME`
- `DATABASE_TYPE`
- `EXAMPLE_MODULE`

如果某一端暂不启用，在 `roles.*.enabled` 中明确写 `false`，不要用空路径表达。

## 不要直接全局替换

这些词有多重含义，不能直接替换：

- `base`
- `cool-admin-midway`
- `cool-admin-vue`
- `cool-uni`

必须先判断它是：

- 模板仓库
- 技术基线
- 新项目目录
- 框架模块名
- 示例业务

## 路径替换规则

只有当文本明确表示“项目目录路径”时，才用配置替换：

- `cool-admin-midway` -> `BACKEND_DIR`
- `cool-admin-vue` -> `ADMIN_DIR`
- `cool-uni` -> `MOBILE_DIR`

这些情况不要替换：

- skill 名称：`cool-admin-midway-dev`
- 技术栈描述：`cool-admin-midway 8.x`
- 官方文档链接
- 框架概念

## 迁移步骤

1. 复制 `skills/`、`docs/`、`README.md`、`AGENTS.md`。
2. 已存在文件不直接覆盖，先备份或记录冲突。
3. 替换 `{{...}}` 占位符。
4. 修新项目根 README，保留新项目已有启动方式；不要把 base README 原样当成业务项目 README。
5. 修 `docs/README.md`，确保引用的文件都存在。
6. 修各端 skill 中的本地规则路径。
7. 对不存在的 `.cursor/rules` 文件标注“如存在”。
8. 扫描残留旧项目名、旧业务示例、旧路径。
9. 输出迁移报告。

## 停止条件

出现下面情况时不要继续覆盖文件：

- 新项目已有 README 且内容明显是项目运行说明
- 新项目已有 docs 且目录结构不同
- 新项目已有 AGENTS.md
- 配置中端目录不存在且未标注“未启用”
- 迁移会覆盖用户已有文档
