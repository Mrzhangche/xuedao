# 团队统一命名规范

## 目的

这份文档用于统一团队在 `base` 基座上的命名方式，避免同一个概念在数据库、后端、前端、文档里出现多套名字。

核心原则只有 4 条：

- 同一个业务对象，在三端和文档里尽量使用同一组英文名
- 先遵循当前项目已有命名，其次遵循 `base`
- 表名、文件名、变量名各用固定风格，不混用
- 名字优先清楚，再考虑短，不要为了省几个字符搞缩写谜语

## 总原则

### 1. 优先级

命名冲突时按下面顺序处理：

1. 用户当前明确要求
2. 当前项目已有命名
3. 本文档
4. `base` 模板中的现成实现

### 2. 一个概念，一个英文名

比如“学生编号”，一旦定为 `studentNo`，就尽量保持：

- 数据库字段：`studentNo`
- Entity 字段：`studentNo`
- 接口字段：`studentNo`
- 表单字段：`studentNo`
- 搜索参数：`studentNo`

不要同一处叫 `studentNo`，另一处叫 `student_code`，再另一处叫 `stuNo`。

### 3. 少缩写

允许保留行业内通用缩写：

- `id`
- `url`
- `sms`
- `wx`
- `api`
- `db`

不建议使用不稳定缩写：

- `stu`
- `cls`
- `cfg`
- `tmpData`
- `infoListDataNew`

## 数据库命名

### 表名

- 统一使用 `snake_case`
- 业务表优先带模块前缀
- 优先使用单数语义，不用复数

推荐：

- `student_info`
- `student_class`
- `student_parent_bind`

不推荐：

- `students`
- `studentInfo`
- `tbl_student`

### 字段名

当前 `base` 的 Midway + TypeORM 基线里，**实体字段和数据库字段统一使用 `camelCase`**。

推荐：

- `studentNo`
- `classId`
- `parentId`
- `createTime`
- `updateTime`
- `orderNum`

不推荐：

- `student_no`
- `class_id`
- `create_time`

说明：

- 这是为了和当前 `base` 的实体写法保持一致
- 如果当前项目已经使用了另一套字段命名，不强行改回，但新项目默认按这套执行

### 主键、外键、状态字段

- 主键统一：`id`
- 关联 ID 统一：`xxxId`
- 排序字段统一：`orderNum`
- 状态字段优先：`status`
- 类型字段优先：`type`
- 备注字段优先：`remark`
- 描述字段优先：`description`
- 创建时间：`createTime`
- 更新时间：`updateTime`
- 创建人：`createUserId`
- 更新人：`updateUserId`

### 布尔字段

数据库如果必须用布尔语义字段，优先使用带语义的名字：

- `isDefault`
- `isEnabled`
- `isDeleted`

如果项目已有状态字段体系，优先用 `status`，不要同时搞一套 `status` 和一套 `isEnable` 表达同一件事。

## 后端命名

### 模块名

- 模块目录统一使用小写英文
- 优先单数名词

推荐：

- `student`
- `course`
- `exam`

不推荐：

- `students`
- `studentManage`
- `eduStudentModule`

### 文件名

#### Midway 模块内文件

- 后端文件优先使用简短小写文件名
- 在模块目录下不要重复写模块名

推荐：

- `entity/info.ts`
- `entity/class.ts`
- `service/info.ts`
- `controller/admin/info.ts`

不推荐：

- `entity/student_info.ts`
- `service/student_info_service.ts`

如果当前项目已有固定生成规则，优先尊重当前项目。

### 类名

- Entity：`PascalCase + Entity`
- Service：`PascalCase + Service`
- Controller：`PascalCase + Controller`
- DTO：`PascalCase + DTO` 或项目已有风格

推荐：

- `StudentInfoEntity`
- `StudentInfoService`
- `AdminStudentInfoController`

### 方法名

- 统一使用 `camelCase`
- 动词在前，名词在后

推荐：

- `changeStatus`
- `bindParent`
- `syncStudentData`
- `pageQueryOp`

不推荐：

- `studentStatusChange`
- `doBind`
- `sync_data`

### 自定义接口路径

- 不要写多层级碎路径
- 自定义方法优先使用单段驼峰命名

推荐：

- `/changeStatus`
- `/bindParent`
- `/importStudent`

不推荐：

- `/student/change/status`
- `/student-detail`

## 前端命名

### Vue / Uni 文件名

- 页面、组件文件统一使用 `kebab-case`

推荐：

- `student-list.vue`
- `student-detail.vue`
- `parent-select.vue`

### 组件名

- 组件文件名用 `kebab-case`
- 组件内部导出名或引用名用 `PascalCase`

推荐：

- 文件：`student-list.vue`
- 变量：`StudentList`

### 变量名

- 普通变量、函数、响应式数据统一使用 `camelCase`
- 布尔变量用 `is`、`has`、`can`、`should` 开头
- 数组尽量用复数名词
- 映射对象用 `xxxMap`
- 选项对象统一可用 `options`

推荐：

- `studentList`
- `studentInfo`
- `isLoading`
- `hasPermission`
- `classMap`
- `options`

不推荐：

- `student_list`
- `loadingFlag`
- `data1`
- `obj`

### 方法命名

- 事件处理函数：`handleXxx`
- 组件回调 / 配置钩子：`onXxx`
- 查询数据：`getXxx`、`fetchXxx`
- 提交保存：`saveXxx`、`submitXxx`

推荐：

- `handleSubmit`
- `onRefresh`
- `fetchStudentPage`
- `saveStudent`

### Store / Hook / Composable

- store：`useXxxStore`
- composable：`useXxx`
- 工具函数文件：按能力命名

推荐：

- `useStudentStore`
- `useStudentForm`
- `useStudentPage`

## 文档命名

- 文档目录名优先使用模块英文名
- 文档文件名前加顺序号，保证阅读顺序稳定

推荐：

- `docs/01-modules/student/01-requirements.md`
- `docs/01-modules/student/03-technical-design.md`

## 推荐词汇表

下面这些词尽量统一使用：

| 中文 | 推荐英文 |
| --- | --- |
| 学生 | `student` |
| 班级 | `class` |
| 课程 | `course` |
| 家长 | `parent` |
| 教师 | `teacher` |
| 学校 | `school` |
| 校区 | `campus` |
| 状态 | `status` |
| 类型 | `type` |
| 编号 | `no` |
| 备注 | `remark` |
| 描述 | `description` |
| 排序 | `orderNum` |

## 落地检查清单

开始写代码前，至少检查这几项：

- 模块目录名是否统一
- 表名是否为 `snake_case`
- 字段名是否与当前 `base` 约定一致
- 前后端同一字段是否同名
- 页面文件名是否为 `kebab-case`
- 布尔变量是否带语义前缀
- 有没有不必要的缩写
