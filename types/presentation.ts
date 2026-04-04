/** Work asset in a track's Work tab (image, video, or link) */
export type PresentationWorkAsset = {
  type: "image" | "video" | "link";
  url: string;
  caption?: string;
};

/** A single track (dimension) of a presentation album */
export type PresentationTrack = {
  id: string;
  title: string;
  about: string;
  work: PresentationWorkAsset[];
  /** Display runtime e.g. "1:00" (MM:SS) */
  duration?: string;
};

/** A presentation album (one project / case study) */
export type PresentationAlbum = {
  id: string;
  title: string;
  subtitle?: string;
  albumArtUrl?: string;
  tracks: PresentationTrack[];
};
