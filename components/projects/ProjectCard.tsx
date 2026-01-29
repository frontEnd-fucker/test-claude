'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Project } from '@/types'
import { MoreVertical, Trash, Edit, FileText, CheckSquare, StickyNote } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { useDeleteProject } from '@/lib/queries/projects'
import { getProjectStats } from '@/lib/queries/projects/api'
import { useQuery } from '@tanstack/react-query'
import { projectKeys } from '@/lib/queries/projects/query-keys'
import ProjectForm from './ProjectForm'

interface ProjectCardProps {
  project: Project
}

/**
 * 项目卡片组件 - 点击体验优化
 *
 * 当前实现方案一：透明覆盖层 + 悬停反馈
 * - 使用绝对定位的Link覆盖整个卡片
 * - 悬停时显示半透明背景色反馈
 * - 内部交互按钮使用e.stopPropagation()阻止事件冒泡
 * - 优点：保持现有DOM结构，实现简单
 *
 * 备选方案二：整个卡片作为Link包装
 * - 将外部div改为Link组件
 * - 内部交互按钮添加onClick={(e) => e.stopPropagation()}
 * - 优点：语义化更好，点击响应更直接
 * - 示例代码：
 *   ```
 *   <Link href={`/project/${project.id}`} className="group relative rounded-lg border bg-card p-4 shadow-sm transition-all hover:shadow-md">
 *     <div className="flex items-start justify-between">
 *       {/* 卡片内容 *\/}
 *       <Button onClick={(e) => e.stopPropagation()}>...</Button>
 *     </div>
 *   </Link>
 *   ```
 */
export default function ProjectCard({ project }: ProjectCardProps) {
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const deleteProjectMutation = useDeleteProject()

  // Fetch project statistics
  const { data: stats } = useQuery({
    queryKey: projectKeys.stat(project.id),
    queryFn: () => getProjectStats(project.id),
    enabled: !!project.id,
  })

  const handleDelete = () => {
    deleteProjectMutation.mutate(project.id)
    setDeleteOpen(false)
  }

  return (
    <div data-testid="project-card" className="group relative rounded-lg border bg-card p-4 shadow-sm transition-all hover:shadow-md">
      {/* 方案一：使用透明覆盖层优化点击体验 - 悬停时显示视觉反馈 */}
      <Link
        href={`/project/${project.id}`}
        className="absolute inset-0 z-10 rounded-lg transition-colors duration-200 hover:bg-accent/5"
        aria-label={`Open project ${project.name}`}
      />
      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 data-testid="card-title" className="font-semibold text-lg">{project.name}</h4>
          </div>
          {project.description && (
            <p className="mt-2 text-sm text-muted-foreground">{project.description}</p>
          )}

          <div className="mt-4 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{stats?.taskCount || 0}</span>
              <span className="text-xs text-muted-foreground">tasks</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{stats?.todoCount || 0}</span>
              <span className="text-xs text-muted-foreground">todos</span>
            </div>
            <div className="flex items-center gap-2">
              <StickyNote className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{stats?.noteCount || 0}</span>
              <span className="text-xs text-muted-foreground">notes</span>
            </div>
          </div>

          <div className="mt-4 text-xs text-muted-foreground">
            Updated {new Date(project.updatedAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative z-10 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setEditOpen(true); }}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={(e) => { e.stopPropagation(); setDeleteOpen(true); }}
              className="text-red-600 focus:text-red-600 focus:bg-red-50"
            >
              <Trash className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ProjectForm
        project={project}
        open={editOpen}
        onOpenChange={setEditOpen}
        hideTrigger={true}
      />

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "<strong>{project.name}</strong>"?
              <br />
              This will also delete all tasks, todos, and notes associated with this project.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteProjectMutation.isPending}
            >
              {deleteProjectMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}