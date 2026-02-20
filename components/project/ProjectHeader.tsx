import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { createClient } from "@/lib/supabase/server-client";
import { Project } from "@/types/database";
import ProjectMembers from "@/components/project/ProjectMembers";

interface ProjectHeaderProps {
  projectId: string;
}

async function getProject(projectId: string): Promise<Project | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: project, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();

  if (error || !project) {
    return null;
  }

  return {
    id: project.id,
    name: project.name,
    description: project.description,
    userId: project.user_id,
    createdAt: new Date(project.created_at),
    updatedAt: new Date(project.updated_at),
  } as Project;
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
  const project = await getProject(projectId);

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
