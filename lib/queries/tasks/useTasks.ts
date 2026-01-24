'use client';

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { taskKeys } from "./query-keys";
import { fetchTasks } from "./api";

interface UseTasksOptions {
  projectId?: string;
  enabled?: boolean;
}

export function useTasks({ projectId: externalProjectId, enabled = true }: UseTasksOptions = {}) {
  const params = useParams();
  const routeProjectId = params.id as string | undefined;

  // 优先使用外部传入的projectId，否则使用路由参数
  const projectId = externalProjectId ?? routeProjectId;

  return useQuery({
    queryKey: taskKeys.list({ projectId }),
    queryFn: () => fetchTasks(projectId),
    enabled: enabled && !!projectId, // 如果没有projectId则禁用查询
    staleTime: 1000 * 60 * 1,
    gcTime: 1000 * 60 * 5,
  });
}
