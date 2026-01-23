import { useQuery } from "@tanstack/react-query";
import { projectKeys } from "./query-keys";
import { fetchProjects } from "./api";

export function useProjects() {
  return useQuery({
    queryKey: projectKeys.list(),
    queryFn: () => fetchProjects(),
    staleTime: 1000 * 60 * 1,
    gcTime: 1000 * 60 * 5,
  });
}