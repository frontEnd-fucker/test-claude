import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { createClient } from "@/lib/supabase/server-client";
import { fetchProject } from "@/lib/queries/projects/api";
import ProjectMembers from "@/components/project/ProjectMembers";

interface ProjectHeaderProps {
  projectId: string;
}

export function ProjectHeaderSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex flex-col gap-3">
        <div className="flex items-center text-sm">
          <div className="h-4 w-16 bg-muted rounded animate-pulse" />
          <div className="h-3 w-3 mx-2" />
          <div className="h-4 w-24 bg-muted rounded animate-pulse" />
        </div>
        <div className="h-7 w-48 bg-muted rounded animate-pulse" />
        <div className="mt-4 pt-4 border-t">
          <div className="h-6 w-32 bg-muted rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export default async function ProjectHeader({ projectId }: ProjectHeaderProps) {
  const supabase = await createClient();
  let project = null;
  try {
    project = await fetchProject(projectId, supabase);
  } catch (error) {
    console.error('Failed to fetch project:', error);
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

        {/* Members section - Client Component embedded in Server Component */}
        <div className="mt-4 pt-4 border-t">
          <ProjectMembers projectId={projectId} compact />
        </div>
      </div>
    </div>
  );
}
