import { useQuery } from "@tanstack/react-query";
import { projectKeys } from "./query-keys";
import { fetchProjects } from "./api";

export function useProjects(searchQuery?: string) {
  return useQuery({
    queryKey: projectKeys.list(searchQuery),
    queryFn: () => fetchProjects(searchQuery),
    staleTime: 1000 * 60 * 1,
    gcTime: 1000 * 60 * 5,
    keepPreviousData: true, // Keep previous data while new data is loading
  });
}