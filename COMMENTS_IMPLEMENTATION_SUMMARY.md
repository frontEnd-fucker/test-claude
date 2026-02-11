# 评论功能实现总结

## 已完成的工作

### 1. 数据库迁移
- 创建了评论表迁移文件：`supabase/migrations/20260208000000_add_comments_table.sql`
- 更新了主schema文件：`lib/supabase/schema.sql`
- 表结构支持：
  - 任务评论和项目评论（互斥）
  - 嵌套回复功能（parent_id）
  - 用户信息和时间戳
  - 级联删除

### 2. TypeScript类型定义
- 扩展了`types/database.ts`：
  - 添加了`Comment`接口
  - 添加了`InsertComment`和`UpdateComment`类型
  - 添加了`isComment`类型守卫函数

### 3. 数据层实现
- 创建了`lib/queries/comments/`目录，包含：
  - `api.ts` - CRUD操作和树结构构建
  - `query-keys.ts` - TanStack Query查询键
  - `useComments.ts` - 查询钩子
  - `useCommentMutations.ts` - 增删改钩子（支持乐观更新）
  - `index.ts` - 导出所有

### 4. 权限系统扩展
- 更新了`lib/permissions/project.ts`：
  - 添加了`view_comments`和`edit_comments`权限
  - 为所有角色分配了适当的评论权限
  - 添加了权限检查函数：
    - `canViewComments()`
    - `canCreateComments()`
    - `canEditComments()`
    - `canDeleteComments()`

### 5. UI组件
- 创建了`components/comments/`目录，包含：
  - `CommentsSection.tsx` - 主组件，包含评论表单和列表
  - `CommentList.tsx` - 评论列表，支持嵌套显示（最大深度3层）
  - `CommentItem.tsx` - 单个评论项，支持编辑、删除、回复
  - `index.ts` - 导出所有组件

### 6. 集成到任务详情页面
- 更新了`app/project/[id]/task/[taskId]/page.tsx`：
  - 在任务描述下方添加了评论部分
  - 使用`<CommentsSection taskId={task.id} />`

### 7. 测试页面
- 创建了`app/test-comments/page.tsx`用于测试

## 功能特性

### 核心功能
1. **任务评论** - 为特定任务添加评论
2. **项目评论** - 为项目添加评论（未来扩展）
3. **嵌套回复** - 支持回复评论，显示为嵌套结构
4. **权限控制** - 基于角色的权限系统

### 用户界面
1. **评论表单** - 支持回复特定评论
2. **评论列表** - 按时间排序，新评论在底部
3. **嵌套显示** - 限制最大深度为3层
4. **用户信息** - 显示用户头像和名称
5. **时间戳** - 相对时间显示（如"2h ago"）

### 交互功能
1. **创建评论** - 支持纯文本评论
2. **编辑评论** - 评论者可以编辑自己的评论
3. **删除评论** - 评论者或管理员可以删除
4. **回复评论** - 支持嵌套回复
5. **取消回复** - 取消正在进行的回复

## 权限规则

### 查看权限
- **所有项目成员**（包括viewer）可以查看评论

### 创建权限
- **owner/admin/member**可以创建评论
- **viewer**不能创建评论

### 编辑权限
- 只能编辑**自己的评论**

### 删除权限
- 评论者可以删除**自己的评论**
- **owner/admin**可以删除**任何评论**

## 技术实现细节

### 数据库设计
- 使用CHECK约束确保评论只关联到任务或项目中的一个
- 使用parent_id支持嵌套回复
- 使用级联删除确保数据一致性
- 创建了适当的索引优化查询性能

### 数据层
- 使用TanStack Query进行状态管理
- 支持乐观更新提供更好的用户体验
- 自动构建评论树结构
- 处理snake_case到camelCase的转换

### 前端组件
- 使用shadcn/ui组件库保持一致性
- 响应式设计
- 加载状态和错误处理
- 表单验证

## 测试计划

### 功能测试
1. 创建评论并验证显示
2. 回复评论并验证嵌套结构
3. 编辑自己的评论
4. 删除评论（自己和管理员）

### 权限测试
1. viewer角色只能查看不能创建
2. member角色可以创建评论
3. 非项目成员不能查看评论

### 边界测试
1. 空评论验证
2. 长评论处理
3. 嵌套深度限制

## 部署步骤

1. **运行数据库迁移**：
   ```bash
   # 将更新的schema.sql复制到Supabase SQL编辑器并执行
   ```

2. **验证表结构**：
   - 确认comments表已创建
   - 确认索引已创建
   - 确认RLS策略已生效

3. **测试功能**：
   - 访问任务详情页面
   - 测试评论功能
   - 验证权限控制

## 已知问题

1. **TypeScript错误** - 剩余两个与任务相关的TypeScript错误（不影响评论功能）
2. **实时更新** - 当前实现需要页面刷新来查看新评论（符合需求）

## 未来扩展建议

1. **实时更新** - 添加WebSocket支持实时评论
2. **富文本支持** - 添加Markdown或富文本编辑器
3. **附件支持** - 允许上传图片或文件
4. **表情反应** - 添加表情反应功能
5. **通知系统** - 评论时通知相关人员
6. **分页支持** - 评论数量多时添加分页

## 文件清单

### 新增文件
- `supabase/migrations/20260208000000_add_comments_table.sql`
- `lib/queries/comments/`（所有文件）
- `components/comments/`（所有文件）
- `app/test-comments/page.tsx`
- `COMMENTS_IMPLEMENTATION_SUMMARY.md`

### 修改文件
- `types/database.ts`
- `lib/permissions/project.ts`
- `lib/supabase/schema.sql`
- `app/project/[id]/task/[taskId]/page.tsx`
- `lib/queries/members/useProjectMembers.ts`

## 验证检查清单

- [x] 数据库表结构正确
- [x] TypeScript类型定义完整
- [x] 数据层API函数实现
- [x] 查询和突变钩子实现
- [x] UI组件实现
- [x] 权限系统集成
- [x] 任务详情页面集成
- [ ] 数据库迁移执行
- [ ] 功能测试通过
- [ ] 权限测试通过