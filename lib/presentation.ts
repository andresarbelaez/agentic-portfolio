import * as fs from "fs/promises";
import * as path from "path";
import type { PresentationAlbum } from "@/types/presentation";

const CONTENT_DIR = path.join(process.cwd(), "content");
const PRESENTATION_DIR = path.join(CONTENT_DIR, "presentation");

const ALBUM_IDS = ["confidant", "meta-lift"] as const;

export async function getPresentationAlbums(): Promise<PresentationAlbum[]> {
  const albums: PresentationAlbum[] = [];
  for (const id of ALBUM_IDS) {
    const filePath = path.join(PRESENTATION_DIR, `${id}.json`);
    try {
      const raw = await fs.readFile(filePath, "utf-8");
      const album = JSON.parse(raw) as PresentationAlbum;
      if (album.id && album.title && Array.isArray(album.tracks)) {
        albums.push(album);
      }
    } catch {
      // Skip missing or invalid files
    }
  }
  return albums;
}
