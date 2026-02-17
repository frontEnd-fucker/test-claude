"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { useProject } from "@/lib/queries/projects";
import ProjectMembers from "@/components/project/ProjectMembers";
import { MinimalSkeleton } from "@/components/ui/skeleton/index";

interface ProjectHeaderProps {
  projectId: string;
}

export default function ProjectHeader({ projectId }: ProjectHeaderProps) {
  const { data: project, isLoading } = useProject(projectId);

  if (isLoading) {
    return (
      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-3">
          {/* Breadcrumb skeleton */}
          <div className="flex items-center text-sm">
            <MinimalSkeleton className="h-4 w-16" />
            <ChevronRight className="h-3 w-3 mx-2" />
            <MinimalSkeleton className="h-4 w-24" />
          </div>
          {/* Title skeleton */}
          <MinimalSkeleton className="h-7 w-48" />
          {/* Members skeleton */}
          <div className="mt-4 pt-4 border-t">
            <MinimalSkeleton className="h-6 w-32" />
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex flex-col gap-3">
        {/* Breadcrumb navigation */}
        <nav
          className="flex items-center text-sm text-muted-foreground"
          aria-label="Breadcrumb"
        >
          <Link
            href="/projects"
            className="hover:text-foreground transition-colors hover:underline"
          >
            Projects
          </Link>
          <ChevronRight className="h-3 w-3 mx-2" />
          <span
            data-testid="project-title"
            className="text-foreground font-medium truncate"
            aria-current="page"
          >
            {project.name}
          </span>
        </nav>

        <div>
          <h1 className="text-2xl font-bold">{project.name}</h1>
          {project.description && (
            <p className="mt-1 text-sm text-muted-foreground">
              {project.description}
            </p>
          )}
        </div>

        {/* Members section */}
        <div className="mt-4 pt-4 border-t">
          <ProjectMembers projectId={projectId} compact />
        </div>
      </div>
    </div>
  );
}
