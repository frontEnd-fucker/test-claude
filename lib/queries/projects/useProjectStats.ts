import { useQuery } from "@tanstack/react-query";
import { projectKeys } from "./query-keys";
import { getProjectStats } from "./api";

export function useProjectStats(id: string | null | undefined) {
  return useQuery({
    queryKey: projectKeys.stat(id!),
    queryFn: () => getProjectStats(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
}