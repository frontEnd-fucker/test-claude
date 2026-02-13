// Mock用户数据
export interface MockUser {
  id: string
  name: string
  avatar: string
}

// Mock评论数据
export interface DemoComment {
  id: string
  userId: string
  content: string
  createdAt: Date
  parentId: string | null  // null表示一级评论
  replies?: DemoComment[]  // 二级评论列表
}

export const mockUsers: MockUser[] = [
  {
    id: 'u1',
    name: 'Alice',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice',
  },
  {
    id: 'u2',
    name: 'Bob',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob',
  },
  {
    id: 'u3',
    name: 'Charlie',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie',
  },
  {
    id: 'u4',
    name: 'Diana',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Diana',
  },
  {
    id: 'u5',
    name: 'Eve',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Eve',
  },
]

export const mockComments: DemoComment[] = [
  {
    id: 'c1',
    userId: 'u1',
    content: '这是一条主评论，内容很长，包含很多文字。这是一段测试内容，用于演示评论系统的长文本显示效果。',
    createdAt: new Date(Date.now() - 3600000), // 1小时前
    parentId: null,
    replies: [
      {
        id: 'c2',
        userId: 'u2',
        content: '这是一条回复，确实评论系统是很重要的功能。',
        createdAt: new Date(Date.now() - 1800000), // 30分钟前
        parentId: 'c1',
      },
      {
        id: 'c3',
        userId: 'u3',
        content: '我也来凑个热闹，发表一下看法。',
        createdAt: new Date(Date.now() - 900000), // 15分钟前
        parentId: 'c1',
      },
    ],
  },
  {
    id: 'c4',
    userId: 'u4',
    content: '这是一个独立的一级评论，没有任何回复。',
    createdAt: new Date(Date.now() - 7200000), // 2小时前
    parentId: null,
    replies: [],
  },
  {
    id: 'c5',
    userId: 'u5',
    content: '第五条评论，看看回复功能是否正常工作。',
    createdAt: new Date(Date.now() - 5400000), // 1.5小时前
    parentId: null,
    replies: [
      {
        id: 'c6',
        userId: 'u1',
        content: '回复这条评论，测试回复功能。',
        createdAt: new Date(Date.now() - 4500000),
        parentId: 'c5',
      },
    ],
  },
]

// 根据用户ID获取用户信息
export function getUserById(userId: string): MockUser | undefined {
  return mockUsers.find((user) => user.id === userId)
}

// 根据评论ID获取评论
export function getCommentById(commentId: string): DemoComment | undefined {
  return mockComments.find((comment) => comment.id === commentId)
}

// 获取一级评论的所有回复
export function getRepliesForComment(
  commentId: string,
  comments: DemoComment[]
): DemoComment[] {
  return comments.filter((comment) => comment.parentId === commentId)
}

// 格式化时间
export function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return '刚刚'
  if (diffMins < 60) return `${diffMins}分钟前`
  if (diffHours < 24) return `${diffHours}小时前`
  if (diffDays < 7) return `${diffDays}天前`
  return date.toLocaleDateString('zh-CN')
}
