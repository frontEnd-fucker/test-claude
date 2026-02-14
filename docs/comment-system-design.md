# 评论系统服务端技术方案

## 概述

前端 Demo 评论交互已完成，需要将 Demo 组件连接到真实后端服务。

**现有基础设施**：

- ✅ 数据库 Schema 完成（`comments` 表支持 `parent_id` 嵌套）
- ✅ 业务逻辑 API 完成（`lib/queries/comments/api.ts`）
- ✅ 前端 Demo 组件完成（`components/demo-comments/`）

**待实现**：

1. React Query Hooks
2. 实时订阅支持（第一期不用实现）
3. 前端组件集成

---

## 架构设计

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Components                          │
│  (CommentsSection, CommentItem, CommentInput)               │
└─────────────────────────┬───────────────────────────────────┘
                          │ useComments / useCreateComment
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              Business Logic (lib/queries/comments/)          │               │
│  - query-keys.ts       → React Query keys                  │
│  - useComments.ts      → useQuery hook                      │
│  - useCommentMutations.ts → useMutation hooks               │
│  - useCommentSubscriptions.ts → 实时订阅（第一期不用实现）                 │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Database                         │
│  - comments table with RLS policies                          │
│  - Realtime enabled（第一期不用实现）                                          │
└─────────────────────────────────────────────────────────────┘
```

**特点**：

- 前端直接调用 `lib/queries/comments/api.ts` 中的函数
- RLS 策略确保数据安全

---

## 1. 数据库设计

### 1.1 表结构

评论系统使用 `comments` 表：

| 字段          | 类型        | 说明                              |
| ------------- | ----------- | --------------------------------- |
| `id`          | uuid        | 主键，自动生成                    |
| `content`     | text        | 评论内容                          |
| `task_id`     | uuid        | 关联任务 ID（与 project_id 互斥） |
| `project_id`  | uuid        | 关联项目 ID（与 task_id 互斥）    |
| `parent_id`   | uuid        | 父评论 ID，null 表示一级评论      |
| `user_id`     | uuid        | 评论作者                          |
| `mention_ids` | uuid[]      | 被 @ 的用户 ID 数组               |
| `created_at`  | timestamptz | 创建时间                          |
| `updated_at`  | timestamptz | 更新时间                          |

同时在 `tasks` 和 `projects` 表中添加评论统计字段：

| 字段             | 类型 | 说明     |
| ---------------- | ---- | -------- |
| `comments_count` | int  | 评论数量 |

**约束**：

- `task_id` 和 `project_id` 必须且仅能存在一个
- `parent_id` 引用自身，支持无限嵌套（实际限制为 2 级）
- 级联删除：删除评论时，其所有回复也会被删除

### 1.2 索引

```sql
CREATE INDEX idx_comments_task_id ON comments(task_id);
CREATE INDEX idx_comments_project_id ON comments(project_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_id);
CREATE INDEX idx_comments_created_at ON comments(created_at DESC);
```

### 1.3 RLS 策略

| 操作   | 策略                              |
| ------ | --------------------------------- |
| SELECT | 项目成员可查看                    |
| INSERT | owner/admin/member 可创建         |
| UPDATE | 仅评论作者可编辑                  |
| DELETE | 评论作者或项目 admin/owner 可删除 |

### 1.4 TypeScript 类型

`types/database/index.ts` 中已有 `Comment` 类型：

```typescript
interface Comment {
  id: string;
  content: string;
  taskId: string | null;
  projectId: string | null;
  parentId: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  user?: Profile;
  replies?: Comment[];
}
```

---

## 2. React Query Hooks

### 文件结构

```
lib/queries/comments/
├── api.ts                    # 业务逻辑（已存在）
├── query-keys.ts             # Query keys
├── useComments.ts            # useQuery hook
├── useCommentMutations.ts    # useMutation hooks
├── useCommentSubscriptions.ts # 实时订阅（第一期不用实现）
└── index.ts                  # 统一导出
```

### 2.1 Query Keys

```typescript
// lib/queries/comments/query-keys.ts
export const commentKeys = {
  all: ["comments"] as const,
  lists: () => [...commentKeys.all, "list"] as const,
  list: (filters: { taskId?: string; projectId?: string }) =>
    [...commentKeys.lists(), filters] as const,
  details: () => [...commentKeys.all, "detail"] as const,
  detail: (id: string) => [...commentKeys.details(), id] as const,
};
```

### 2.2 useComments

```typescript
// lib/queries/comments/useComments.ts
import { useQuery } from "@tanstack/react-query";
import { fetchComments } from "./api";
import { commentKeys } from "./query-keys";

export function useComments(options: { taskId?: string; projectId?: string }) {
  return useQuery({
    queryKey: commentKeys.list(options),
    queryFn: () => fetchComments(options),
    staleTime: 5 * 60 * 1000,
  });
}
```

### 2.3 useCommentMutations

```typescript
// lib/queries/comments/useCommentMutations.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createComment, updateComment, deleteComment } from "./api";
import { commentKeys } from "./query-keys";
import { toast } from "sonner";

export function useCreateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createComment,
    onSuccess: (newComment) => {
      const filters = newComment.taskId
        ? { taskId: newComment.taskId }
        : { projectId: newComment.projectId };
      queryClient.invalidateQueries({ queryKey: commentKeys.list(filters) });
      toast.success("评论已发布");
    },
    onError: (error: Error) => {
      toast.error(error.message || "发布评论失败");
    },
  });
}

export function useUpdateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      updateComment(id, { content }),
    onSuccess: (updatedComment) => {
      queryClient.invalidateQueries({
        queryKey: commentKeys.detail(updatedComment.id),
      });
      toast.success("评论已更新");
    },
    onError: (error: Error) => {
      toast.error(error.message || "更新评论失败");
    },
  });
}

export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commentKeys.all });
      toast.success("评论已删除");
    },
    onError: (error: Error) => {
      toast.error(error.message || "删除评论失败");
    },
  });
}
```

### 2.4 useCommentSubscriptions（第一期不用实现）

```typescript
// lib/queries/comments/useCommentSubscriptions.ts
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { commentKeys } from "./query-keys";

export function useCommentSubscriptions(options: {
  taskId?: string;
  projectId?: string;
}) {
  const queryClient = useQueryClient();
  const supabase = createClient();

  useEffect(() => {
    const filters = options.taskId
      ? { task_id: options.taskId }
      : { project_id: options.projectId };

    const channel = supabase
      .channel("comments")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "comments", filter: filters },
        () => {
          queryClient.invalidateQueries({ queryKey: commentKeys.all });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, supabase, options.taskId, options.projectId]);
}
```

### 2.5 统一导出

```typescript
// lib/queries/comments/index.ts
export * from "./api";
export * from "./query-keys";
export * from "./useComments";
export * from "./useCommentMutations";
export * from "./useCommentSubscriptions";
```

---

## 3. 前端组件集成

前端组件直接调用 React Query Hooks：

```typescript
// components/comments/CommentsSection.tsx
"use client";

import { useComments, useCreateComment } from "@/lib/queries/comments";
import { useState } from "react";

export function CommentsSection({ taskId, projectId }: Props) {
  const { data: comments, isLoading } = useComments({ taskId, projectId });
  const createComment = useCreateComment();
  const [replyingTo, setReplyingTo] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [inputValue, setInputValue] = useState("");

  const handleSubmit = () => {
    createComment.mutate({
      taskId,
      projectId,
      parentId: replyingTo?.id || null,
      content: inputValue.trim(),
    });
    setInputValue("");
    setReplyingTo(null);
  };

  if (isLoading) return <div>加载中...</div>;

  return (
    <CommentsSection
      comments={comments || []}
      replyingTo={replyingTo}
      onReply={setReplyingTo}
      inputValue={inputValue}
      onInputChange={setInputValue}
      onSubmit={handleSubmit}
    />
  );
}
```

**与 Demo 组件的关系**：

- `components/demo-comments/` → 保持用于演示（使用 mock 数据）
- `components/comments/` → 新建，用于生产环境（使用真实 API）

---

## 4. @mention 功能

前端解析 @mention 并直接传递给业务逻辑函数：

```typescript
// 前端解析 @mention
function parseContentMentions(
  content: string,
  availableUsers: { id: string; name: string }[]
): string[] {
  const mentionRegex = /@(\w+)/g;
  const usernames = [...content.matchAll(mentionRegex)].map((m) => m[1]);
  const uniqueUsernames = [...new Set(usernames)];

  const userNameToId = new Map(availableUsers.map((u) => [u.name, u.id]));

  return uniqueUsernames
    .filter((username) => userNameToId.has(username))
    .map((username) => userNameToId.get(username)!);
}

// 提交评论时
const mentionIds = parseContentMentions(inputValue, projectMembers);
createComment.mutate({
  taskId,
  projectId,
  parentId: replyingTo?.id || null,
  content: inputValue.trim(),
  mentionIds,
});
```

**优点**：

- 前端已有项目成员列表，可直接使用
- 直接调用 `api.ts` 中的函数，无需 API 层
- 实现简单，性能好

如需持久化存储，可添加字段：

```sql
ALTER TABLE comments ADD COLUMN mention_ids uuid[] DEFAULT '{}';
```

---

## 5. 数据库扩展

### 5.1 评论统计缓存

**为什么需要**

在任务卡片或项目列表中显示评论数量时，COUNT 查询在大数据量下会成为性能瓶颈：

| 场景                | 问题                       |
| ------------------- | -------------------------- |
| 单个任务            | COUNT 每次都要扫描所有评论 |
| 列表页（20 个任务） | 20 次 COUNT 查询           |
| 高频访问            | 每次加载都重新 COUNT       |

**解决方案**

添加 `comments_count` 字段：

```sql
ALTER TABLE tasks ADD COLUMN comments_count int DEFAULT 0;
ALTER TABLE projects ADD COLUMN comments_count int DEFAULT 0;
```

**自动更新触发器**：

```sql
CREATE OR REPLACE FUNCTION update_comments_count()
RETURNS TRIGGER AS $$
DECLARE
  target_id uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    target_id := COALESCE(NEW.task_id, NEW.project_id);
    IF NEW.task_id IS NOT NULL THEN
      UPDATE tasks SET comments_count = comments_count + 1 WHERE id = target_id;
    ELSE
      UPDATE projects SET comments_count = comments_count + 1 WHERE id = target_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    target_id := COALESCE(OLD.task_id, OLD.project_id);
    IF OLD.task_id IS NOT NULL THEN
      UPDATE tasks SET comments_count = comments_count - 1 WHERE id = target_id;
    ELSE
      UPDATE projects SET comments_count = comments_count - 1 WHERE id = target_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_comments_count
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_comments_count();
```

**性能对比**：

| 对比项   | 实时 COUNT | 缓存字段  |
| -------- | ---------- | --------- |
| 查询性能 | O(n) 扫描  | O(1) 读取 |
| 列表页   | N 次查询   | N 次读取  |
| 写入性能 | 无额外开销 | +1 UPDATE |

### 5.2 Realtime 配置（第一期不用实现）

在 Supabase Dashboard 中启用 `comments` 表的 Realtime：

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE comments;
```

---

## 6. 评论获取与树形结构

### 6.1 数据获取策略

```
首次加载：获取最新 10 条主评论 + 每个主评论的前 3 条回复
    ↓ 用户滚动
增量加载：获取更早的主评论（cursor 分页）
    ↓ 点击"还有 X 条回复"
加载完整：获取单个主评论的所有回复
```

### 6.2 两次查询方案

Supabase 内联查询无法直接限制子记录数量，采用两次查询方案：

```typescript
// lib/queries/comments/fetch-comments.ts
import { createClient } from "@/lib/supabase/client";
import { Comment, Profile } from "@/types/database";

interface FetchOptions {
  taskId?: string;
  projectId?: string;
  limit?: number;
  cursor?: string;
}

interface Reply {
  id: string;
  content: string;
  createdAt: Date;
  user: Pick<Profile, "id" | "name" | "avatarUrl">;
}

interface CommentWithReplies extends Omit<Comment, "replies"> {
  replies: Reply[];
  repliesCount: number;
  repliesLoaded: number;
  hasMoreReplies: boolean;
}

// 回复数量限制
const REPLIES_LIMIT = 3;

export async function fetchCommentsWithReplies(
  options: FetchOptions
): Promise<{ data: CommentWithReplies[]; nextCursor: string | null }> {
  const supabase = createClient();
  const { taskId, projectId, limit = 10, cursor } = options;

  // 1. 查询主评论
  let mainQuery = supabase
    .from("comments")
    .select(
      `
      *,
      user:profiles!comments_user_id_fkey (
        id,
        name,
        avatar_url
      )
    `
    )
    .eq("task_id", taskId!)
    .is("parent_id", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (cursor) {
    mainQuery = mainQuery.lt("created_at", cursor);
  }

  const { data: mainComments, error } = await mainQuery;
  if (error) throw error;

  // 2. 获取主评论 IDs
  const mainIds = mainComments.map((c) => c.id);

  // 3. 查询所有回复（然后在代码中限制前 3 条）
  const { data: allReplies, error: repliesError } = await supabase
    .from("comments")
    .select(
      `
      *,
      user:profiles!comments_user_id_fkey (
        id,
        name,
        avatar_url
      )
    `
    )
    .in("parent_id", mainIds)
    .order("created_at", { ascending: true });

  if (repliesError) throw repliesError;

  // 4. 按 parent_id 分组，每组取前 3 条
  const repliesMap = new Map<string, typeof allReplies>();
  const repliesCountMap = new Map<string, number>();

  // 先按 parent_id 分组
  allReplies?.forEach((reply) => {
    const list = repliesMap.get(reply.parent_id) || [];
    list.push(reply);
    repliesMap.set(reply.parent_id, list);
  });

  // 计算每组总数
  mainIds.forEach((id) => {
    const total = allReplies?.filter((r) => r.parent_id === id).length || 0;
    repliesCountMap.set(id, total);
  });

  // 5. 构建返回结构
  const comments: CommentWithReplies[] = mainComments.map((comment) => {
    const replies = (repliesMap.get(comment.id) || [])
      .slice(0, REPLIES_LIMIT)
      .map((reply: any) => ({
        id: reply.id,
        content: reply.content,
        createdAt: new Date(reply.created_at),
        user: {
          id: reply.user.id,
          name: reply.user.name,
          avatarUrl: reply.user.avatar_url,
        },
      }));

    const totalCount = repliesCountMap.get(comment.id) || 0;

    return {
      id: comment.id,
      content: comment.content,
      taskId: comment.task_id,
      projectId: comment.project_id,
      parentId: comment.parent_id,
      userId: comment.user_id,
      createdAt: new Date(comment.created_at),
      updatedAt: new Date(comment.updated_at),
      user: {
        id: comment.user.id,
        name: comment.user.name,
        avatarUrl: comment.user.avatar_url,
      },
      replies,
      repliesCount: totalCount,
      repliesLoaded: replies.length,
      hasMoreReplies: totalCount > replies.length,
    };
  });

  return {
    data: comments,
    nextCursor:
      mainComments.length > 0
        ? mainComments[mainComments.length - 1].created_at
        : null,
  };
}
```

**查询说明**：

| 步骤 | 查询内容   | 说明                   |
| ---- | ---------- | ---------------------- |
| 1    | 主评论     | 获取最新 10 条一级评论 |
| 2    | 主评论 IDs | 收集 IDs 用于后续查询  |
| 3    | 所有回复   | 查询所有主评论的回复   |
| 4    | 分组限制   | 代码中每组取前 3 条    |
| 5    | 构建结构   | 组装返回数据           |

**优势**：虽然有 2 次查询，但查询条件简单，性能良好，且灵活可控。

**返回 JSON 格式**：

```json
{
  "data": [
    {
      "id": "c1",
      "content": "这是一个主评论",
      "taskId": "t1",
      "projectId": null,
      "parentId": null,
      "userId": "u1",
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T10:00:00Z",
      "user": {
        "id": "u1",
        "name": "Alice",
        "avatarUrl": "https://example.com/avatar1.png"
      },
      "replies": [
        {
          "id": "r1",
          "content": "这是回复1",
          "createdAt": "2024-01-15T10:05:00Z",
          "user": {
            "id": "u2",
            "name": "Bob",
            "avatarUrl": "https://example.com/avatar2.png"
          }
        },
        {
          "id": "r2",
          "content": "这是回复2",
          "createdAt": "2024-01-15T10:10:00Z",
          "user": {
            "id": "u3",
            "name": "Charlie",
            "avatarUrl": "https://example.com/avatar3.png"
          }
        }
      ],
      "repliesCount": 5,
      "repliesLoaded": 3,
      "hasMoreReplies": true
    },
    {
      "id": "c2",
      "content": "这是另一个主评论",
      "replies": [],
      "repliesCount": 0,
      "repliesLoaded": 0,
      "hasMoreReplies": false,
      ...
    }
  ],
  "nextCursor": "2024-01-15T09:00:00Z"
}
```

**字段说明**：

| 字段 | 类型 | 说明 |
|------|------|------|
| `replies` | Reply[] | 当前已加载的回复列表（最多 3 条） |
| `repliesCount` | number | 该评论下回复的总数 |
| `repliesLoaded` | number | 当前已加载的回复数量 |
| `hasMoreReplies` | boolean | 是否有更多回复未加载 |
| `nextCursor` | string \| null | 下一页的游标，null 表示没有更多数据 |

### 6.3 获取单个评论的全部回复

当需要显示单个评论的全部回复时：

```typescript
// lib/queries/comments/fetch-replies.ts
import { createClient } from "@/lib/supabase/client";
import { Comment, Profile } from "@/types/database";

interface Reply {
  id: string;
  content: string;
  createdAt: Date;
  user: Pick<Profile, "id" | "name" | "avatarUrl">;
}

export async function fetchAllReplies(parentId: string): Promise<Reply[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("comments")
    .select(
      `
      id,
      content,
      created_at,
      user:profiles!comments_user_id_fkey (
        id,
        name,
        avatar_url
      )
    `
    )
    .eq("parent_id", parentId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return data.map((reply: any) => ({
    id: reply.id,
    content: reply.content,
    createdAt: new Date(reply.created_at),
    user: {
      id: reply.user.id,
      name: reply.user.name,
      avatarUrl: reply.user.avatar_url,
    },
  }));
}
```

### 6.4 React Query Hooks

```typescript
// lib/queries/comments/useComments.ts
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchCommentsWithReplies, fetchAllReplies } from "./fetch-comments";
import { commentKeys } from "./query-keys";

export function useComments(options: { taskId?: string; projectId?: string }) {
  return useQuery({
    queryKey: commentKeys.list(options),
    queryFn: () => fetchCommentsWithReplies(options),
    staleTime: 5 * 60 * 1000,
  });
}

export function useReplies(parentId: string) {
  return useQuery({
    queryKey: ["replies", parentId],
    queryFn: () => fetchAllReplies(parentId),
    enabled: !!parentId,
  });
}
```

### 6.5 前端组件集成

```typescript
// components/comments/CommentsSection.tsx
"use client";

import { useComments } from "@/lib/queries/comments";
import { useState } from "react";

export function CommentsSection({ taskId }: { taskId: string }) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      // ... 使用 TanStack Query 的 useInfiniteQuery
    });

  return (
    <div className="space-y-4">
      {data?.pages.map((page, i) => (
        <Fragment key={i}>
          {page.data.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
        </Fragment>
      ))}
      {hasNextPage && (
        <button onClick={() => fetchNextPage()}>
          {isFetchingNextPage ? "加载中..." : "加载更多"}
        </button>
      )}
    </div>
  );
}

function CommentItem({ comment }: { comment: CommentWithReplies }) {
  const [showAllReplies, setShowAllReplies] = useState(false);

  return (
    <div className="border rounded-lg p-4">
      {/* 主评论内容 */}
      <div className="flex items-start gap-3">
        <img src={comment.user.avatarUrl} className="w-10 h-10 rounded-full" />
        <div className="flex-1">
          <div className="font-medium">{comment.user.name}</div>
          <div className="mt-1">{comment.content}</div>
        </div>
      </div>

      {/* 回复列表 */}
      {comment.replies.length > 0 && (
        <div className="mt-3 pl-12 space-y-3">
          {comment.replies.map((reply) => (
            <ReplyItem key={reply.id} reply={reply} />
          ))}

          {/* 显示"还有 X 条回复" */}
          {comment.repliesCount > comment.repliesLoaded && !showAllReplies && (
            <button
              className="text-blue-500 text-sm"
              onClick={() => setShowAllReplies(true)}
            >
              还有 {comment.repliesCount - comment.repliesLoaded} 条回复
            </button>
          )}
        </div>
      )}
    </div>
  );
}
```

---

## 7. 测试验证

1. **启动开发服务器**：`pnpm dev`
2. **访问测试页面**：`/demo/comments`
3. **验证功能**：
   - [ ] 创建一级评论
   - [ ] 回复一级评论
   - [ ] 回复二级评论（确认 @mention）
   - [ ] 编辑评论
   - [ ] 删除评论
   - [ ] 实时更新（多窗口测试）

---

## 8. 关键文件清单

| 文件                                              | 操作             |
| ------------------------------------------------- | ---------------- |
| `lib/queries/comments/query-keys.ts`              | 新建             |
| `lib/queries/comments/useComments.ts`             | 新建             |
| `lib/queries/comments/useCommentMutations.ts`     | 新建             |
| `lib/queries/comments/useCommentSubscriptions.ts` | 新建             |
| `lib/queries/comments/index.ts`                   | 更新             |
| `components/comments/`                            | 新建（生产组件） |
