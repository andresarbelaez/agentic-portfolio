import * as fs from "fs/promises";
import * as path from "path";
import type { Project } from "@/types/project";

const CONTENT_DIR = path.join(process.cwd(), "content");
const PROJECTS_FILE = path.join(CONTENT_DIR, "projects.json");

export async function getProjects(): Promise<Project[]> {
  const raw = await fs.readFile(PROJECTS_FILE, "utf-8");
  const data = JSON.parse(raw) as { projects: Project[] };
  return Array.isArray(data.projects) ? data.projects : [];
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const projects = await getProjects();
  return projects.find((p) => p.slug === slug) ?? null;
}

export async function getVisibleProjects(): Promise<Project[]> {
  const projects = await getProjects();
  return projects.filter((p) => !p.hidden);
}
