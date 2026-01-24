import { useQuery } from "@tanstack/react-query";
import { taskKeys } from "./query-keys";
import { fetchTasks } from "./api";

interface UseTasksOptions {
  projectId?: string;
  enabled?: boolean;
}

export function useTasks({ projectId, enabled = true }: UseTasksOptions = {}) {
  return useQuery({
    queryKey: taskKeys.list({ projectId }),
    queryFn: () => fetchTasks(projectId),
    enabled,
    staleTime: 1000 * 60 * 1,
    gcTime: 1000 * 60 * 5,
  });
}
