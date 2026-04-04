import { getVisibleProjects } from "@/lib/projects";
import { getPresentationAlbums } from "@/lib/presentation";
import { DesktopShell } from "./components/DesktopShell";

/** Set to `true` to show the iTunes-style Portfolio window and desktop icon. */
const SHOW_PORTFOLIO_PRESENTATION = false;

export default async function Home() {
  const projects = await getVisibleProjects();
  const presentationAlbums = SHOW_PORTFOLIO_PRESENTATION
    ? await getPresentationAlbums()
    : [];
  return (
    <DesktopShell
      projects={projects}
      presentationAlbums={presentationAlbums}
    />
  );
}
