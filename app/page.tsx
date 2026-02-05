import { getVisibleProjects } from "@/lib/projects";
import { DesktopShell } from "./components/DesktopShell";

export default async function Home() {
  const projects = await getVisibleProjects();
  return <DesktopShell projects={projects} />;
}
