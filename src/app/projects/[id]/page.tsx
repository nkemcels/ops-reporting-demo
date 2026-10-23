import { PROJECTS } from "@/lib/data/seed";
import { ProjectDetailView } from "@/features/projects/ProjectDetailView";

/** Pre-render every known project so the demo can be deployed as static files. */
export function generateStaticParams() {
  return PROJECTS.map((p) => ({ id: p.id }));
}

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProjectDetailView id={id} />;
}
