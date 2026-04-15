## 示例 1：新增 cool-admin-vue 后台模块

需求：新增“活动管理”后台模块，包含列表、搜索、增删改查。

执行顺序：

1. 激活总控 skill。
2. 判断目标端为 `cool-admin-vue`。
3. 继续读取 `../cool-admin-vue-dev/SKILL.md`。
4. 优先检查当前项目 `src/modules` 是否已有同类业务模块。
5. 若没有，参考模板仓库中的 `cool-admin-vue/src/modules/demo` 与 CRUD 示例。
6. 输出：
   - 模块落点
   - 页面文件结构
   - CRUD 组件选型
   - 字段与搜索方案
   - 开发实施文档

## 示例 2：新增 cool-admin-midway 业务模块

需求：新增“优惠券”模块，包含实体、后台接口、服务逻辑。

执行顺序：

1. 激活总控 skill。
2. 判断目标端为 `cool-admin-midway`。
3. 继续读取 `../cool-admin-midway-dev/SKILL.md`。
4. 先读 `.cursorrules` 与 `module.mdc`，再按任务继续读 `controller.mdc`、`service.mdc`、`db.mdc`。
5. 优先复用 `src/modules` 下同类模块目录结构。
6. 输出：
   - 实体设计
   - Controller / Service 边界
   - CRUD 与自定义接口区分
   - 接口说明
   - 联调清单

## 示例 3：新增 cool-uni 页面并接后台接口

需求：新增“我的优惠券”页面，并接入服务端分页接口。

执行顺序：

1. 激活总控 skill。
2. 判断目标端为 `cool-uni`。
3. 继续读取 `../cool-uni-dev/SKILL.md`。
4. 因无本地规则文件，按“当前项目代码 > `cool-uni` 模板 > 官方文档 > 团队级参考”执行。
5. 先确认页面落点、路由方式、接口调用方式，再写页面。
6. 输出：
   - 页面路径
   - 接口接入方式
   - 状态流转
   - 空状态 / 加载 / 错误处理
   - 给初级开发者看的实施步骤
