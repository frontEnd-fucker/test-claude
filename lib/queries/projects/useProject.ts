import { useQuery } from "@tanstack/react-query";
import { projectKeys } from "./query-keys";
import { fetchProject } from "./api";

export function useProject(id: string | null | undefined) {
  return useQuery({
    queryKey: projectKeys.detail(id!),
    queryFn: () => fetchProject(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 1,
    gcTime: 1000 * 60 * 5,
  });
}