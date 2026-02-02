import { notFound } from "next/navigation";
import Link from "next/link";
import { getProjectBySlug, getProjects } from "@/lib/projects";

export async function generateStaticParams() {
  const projects = await getProjects();
  return projects.map((p) => ({ slug: p.slug }));
}

export default async function ProjectPage({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = params;
  const project = await getProjectBySlug(slug);
  if (!project) notFound();

  return (
    <main className="min-h-screen p-8 max-w-2xl mx-auto">
      <Link href="/" className="text-sm text-blue-600 hover:underline mb-6 inline-block">
        ← Back to desktop
      </Link>
      <h1 className="text-2xl font-semibold">{project.title}</h1>
      <p className="mt-2 text-neutral-700">{project.summary}</p>
      {project.skills.length > 0 && (
        <p className="mt-2 text-sm text-neutral-600">
          <span className="font-medium">Skills:</span> {project.skills.join(", ")}
        </p>
      )}
      {project.evidence && (
        <p className="mt-2 text-sm text-neutral-600 italic">{project.evidence}</p>
      )}
      <a
        href={project.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-block text-blue-600 hover:underline"
      >
        View project →
      </a>
    </main>
  );
}
