'use client';

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { taskKeys } from "./query-keys";
import { fetchTimelineData } from "./api";

export function useTimelineData(projectId?: string) {
  const params = useParams();
  const routeProjectId = params.id as string | undefined;

  const finalProjectId = projectId ?? routeProjectId;

  return useQuery({
    queryKey: taskKeys.timeline(finalProjectId),
    queryFn: () => fetchTimelineData(finalProjectId),
    enabled: !!finalProjectId,
    staleTime: 1000 * 60 * 1, // 1 minute
    gcTime: 1000 * 60 * 5, // 5 minutes
  });
}