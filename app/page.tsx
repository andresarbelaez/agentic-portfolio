import { getVisibleProjects } from "@/lib/projects";
import { getPresentationAlbums } from "@/lib/presentation";
import { DesktopShell } from "./components/DesktopShell";

export default async function Home() {
  const [projects, presentationAlbums] = await Promise.all([
    getVisibleProjects(),
    getPresentationAlbums(),
  ]);
  return (
    <DesktopShell
      projects={projects}
      presentationAlbums={presentationAlbums}
    />
  );
}
