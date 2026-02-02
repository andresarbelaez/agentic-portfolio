import { getProjects } from "@/lib/projects";
import { DesktopShell } from "./components/DesktopShell";

export default async function Home() {
  const projects = await getProjects();
  return <DesktopShell projects={projects} />;
}
