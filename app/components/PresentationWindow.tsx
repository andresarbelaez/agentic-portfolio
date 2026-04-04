"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import {
  FaBackward,
  FaForward,
  FaPlay,
  FaPause,
  FaRedo,
  FaVolumeDown,
  FaVolumeUp,
  FaMusic,
  FaFilm,
  FaTv,
  FaMicrophone,
  FaMobileAlt,
  FaBroadcastTower,
  FaShoppingBag,
  FaHome,
  FaStar,
  FaCompactDisc,
  FaList,
  FaWrench,
  FaUser,
  FaPlus,
  FaRandom,
  FaEject,
  FaAtom,
  FaSearch,
  FaThLarge,
  FaColumns,
} from "react-icons/fa";
import { XPTitleBarButtons } from "./XPTitleBarButtons";
import type { PresentationAlbum, PresentationWorkAsset } from "@/types/presentation";
import itunesSpec from "@/lib/itunes-ui-spec.json";

const TASKBAR_HEIGHT = 36;
/** Left indent for toolbar playback row (pl-12) and sidebar items so icons align. */
const SIDEBAR_LEFT_INDENT = 48;
/** Slight proportional increase for all text in the center panel only. */
const CENTER_PANEL_FONT_SCALE = 1.15;
/** Bottom bar left indent: greater than SIDEBAR_LEFT_INDENT so left buttons sit further in. */
const BOTTOM_BAR_LEFT_INDENT = 56;
/** Bottom bar button dimensions: rectangular (height ≈ half of width), grouped with no gap. */
const BOTTOM_BAR_BTN = { width: 50, height: 25 };
/** Right-side button group: more space from window edge. */
const BOTTOM_BAR_RIGHT_PADDING = 20;
/** Extra vertical padding for bottom bar content so the bar is taller. */
const BOTTOM_BAR_VERTICAL_PADDING = 10;
/** Scale factor for left sidebar text and icons. */
const LEFT_SIDEBAR_SCALE = 1.2;
const BTN_EMBOSS = "linear-gradient(180deg, #f0f0f0 0%, #d0d0d0 50%, #b8b8b8 100%)";
const GREEN_PROGRESS = "linear-gradient(180deg, #6cb84a 0%, #5aa038 100%)";

/** Circular playback button: skeuomorphic grey with outer ring, convex gradient, dark icon */
const PLAYBACK_BTN = {
  sizePrevNext: 36,
  sizePlayPause: 40,
  gap: 4,
  iconSizePrevNext: 14,
  iconSizePlayPause: 16,
  border: "1px solid #b0b0b0",
  background: "radial-gradient(circle at 32% 28%, #ffffff 0%, #f0f0f0 25%, #e6e6e6 60%, #e0e0e0 100%)",
  boxShadow: "inset 1px 1px 0 rgba(255,255,255,0.85), 1px 2px 2px rgba(0,0,0,0.12)",
  iconColor: "#333333",
} as const;

function gradient(arr: string[], deg = 180): string {
  if (!Array.isArray(arr) || arr.length < 2) return arr[0] ?? "transparent";
  const step = 100 / (arr.length - 1);
  return `linear-gradient(${deg}deg, ${arr.map((c, i) => `${c} ${i * step}%`).join(", ")})`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const spec = itunesSpec as any;

/** Dummy sidebar sections matching reference (no functionality). Icons shown to the left of each item. */
const LEFT_SIDEBAR_SECTIONS: {
  title: string;
  items: { id: string; label: string; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }> }[];
}[] = [
  {
    title: "LIBRARY",
    items: [
      { id: "music", label: "Music", icon: FaMusic },
      { id: "movies", label: "Movies", icon: FaFilm },
      { id: "tv", label: "TV Shows", icon: FaTv },
      { id: "podcasts", label: "Podcasts", icon: FaMicrophone },
      { id: "apps", label: "Apps", icon: FaMobileAlt },
      { id: "radio", label: "Radio", icon: FaBroadcastTower },
    ],
  },
  { title: "STORE", items: [{ id: "store", label: "iTunes Store", icon: FaShoppingBag }] },
  { title: "SHARED", items: [{ id: "shared", label: "Home Sharing", icon: FaHome }] },
  { title: "GENIUS", items: [{ id: "genius", label: "Genius", icon: FaStar }] },
  {
    title: "PLAYLISTS",
    items: [
      { id: "dj", label: "iTunes DJ", icon: FaCompactDisc },
      { id: "90s", label: "90's Music", icon: FaList },
      { id: "classical", label: "Classical Music", icon: FaList },
      { id: "videos", label: "Music Videos", icon: FaList },
      { id: "toprated", label: "My Top Rated", icon: FaList },
      { id: "recent", label: "Recently Added", icon: FaList },
      { id: "played", label: "Recently Played", icon: FaList },
      { id: "top25", label: "Top 25 Most Played", icon: FaList },
    ],
  },
];

function MusicNoteIconSvg({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 16 16" width={16} height={16} className={className} style={style} fill="currentColor">
      <path d="M8 1v6.18c-.3-.2-.65-.34-1-.4V3.5L4 5v4.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5L8 1zm1 5.18V2.47l3 1.5v4.71c0 1.38-1.12 2.5-2.5 2.5S7 11.06 7 9.68c0-1.38 1.12-2.5 2.5-2.5.45 0 .87.12 1.24.32V6.18z" />
    </svg>
  );
}

function getYouTubeEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === "www.youtube.com" && u.pathname === "/watch" && u.searchParams.get("v")) {
      return `https://www.youtube.com/embed/${u.searchParams.get("v")}`;
    }
    if (u.hostname === "youtu.be" && u.pathname.length > 1) {
      return `https://www.youtube.com/embed/${u.pathname.slice(1).split("?")[0]}`;
    }
    if (u.hostname === "www.youtube.com" && u.pathname.startsWith("/embed/")) {
      return url;
    }
  } catch {
    // not a valid URL
  }
  return null;
}

function WorkAssetBlock({ asset }: { asset: PresentationWorkAsset }) {
  if (asset.type === "image") {
    return (
      <div className="mb-3">
        <img
          src={asset.url}
          alt={asset.caption ?? ""}
          className="max-w-full h-auto rounded border border-neutral-300"
          style={{ maxHeight: "360px" }}
        />
        {asset.caption && <p className="text-xs text-neutral-500 mt-1">{asset.caption}</p>}
      </div>
    );
  }
  if (asset.type === "video") {
    const youtubeEmbed = getYouTubeEmbedUrl(asset.url);
    if (youtubeEmbed) {
      return (
        <div className="mb-3">
          <div className="relative w-full rounded border border-neutral-300 overflow-hidden" style={{ aspectRatio: "16/9", maxHeight: "320px" }}>
            <iframe
              src={youtubeEmbed}
              title="Video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            />
          </div>
          {asset.caption && <p className="text-xs text-neutral-500 mt-1">{asset.caption}</p>}
        </div>
      );
    }
    return (
      <div className="mb-3">
        <video
          src={asset.url}
          controls
          className="max-w-full h-auto rounded border border-neutral-300"
          style={{ maxHeight: "320px" }}
        >
          Your browser does not support the video tag.
        </video>
        {asset.caption && <p className="text-xs text-neutral-500 mt-1">{asset.caption}</p>}
      </div>
    );
  }
  // link
  return (
    <div className="mb-3">
      <a
        href={asset.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 underline hover:text-blue-800"
      >
        {asset.caption ?? asset.url}
      </a>
    </div>
  );
}

type PresentationWindowProps = {
  albums: PresentationAlbum[];
  onClose: () => void;
  onMinimize?: () => void;
  hidden?: boolean;
  style?: React.CSSProperties;
  zIndex?: number;
  onBringToFront?: () => void;
};

const SIDEBAR_WIDTH = 180;
const DETAIL_WIDTH = 300;

function getMaximizedSize() {
  if (typeof window === "undefined") return { width: 800, height: 564 };
  return {
    width: window.innerWidth,
    height: window.innerHeight - TASKBAR_HEIGHT,
  };
}

export function PresentationWindow({
  albums,
  onClose,
  onMinimize,
  hidden = false,
  style,
  zIndex = 48,
  onBringToFront,
}: PresentationWindowProps) {
  const [size, setSize] = useState(getMaximizedSize);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(albums[0]?.id ?? null);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<"about" | "work">("about");
  const [viewMode, setViewMode] = useState<"list" | "grid" | "column">("grid");
  const [isPlaying, setIsPlaying] = useState(false);
  /** Elapsed seconds for Now Playing; resets when selected track changes. */
  const [nowPlayingElapsedSeconds, setNowPlayingElapsedSeconds] = useState(0);
  const [geniusSidebarWidth, setGeniusSidebarWidth] = useState(() => (itunesSpec as { rightSidebar?: { width?: number } }).rightSidebar?.width ?? 600);
  const [isResizingGenius, setIsResizingGenius] = useState(false);
  const mainContentRef = useRef<HTMLDivElement>(null);
  const resizeStartRef = useRef<{ x: number; w: number } | null>(null);

  // Genius sidebar resize: window mousemove/mouseup during drag
  useEffect(() => {
    if (!isResizingGenius) return;
    const prevCursor = document.body.style.cursor;
    const prevSelect = document.body.style.userSelect;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    const onMove = (e: MouseEvent) => {
      const start = resizeStartRef.current;
      if (!start || !mainContentRef.current) return;
      const deltaX = start.x - e.clientX;
      const rect = mainContentRef.current.getBoundingClientRect();
      const maxW = Math.max(rect.width, 400);
      const next = Math.min(maxW, Math.max(280, start.w + deltaX));
      setGeniusSidebarWidth(next);
    };
    const onUp = () => {
      resizeStartRef.current = null;
      setIsResizingGenius(false);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      document.body.style.cursor = prevCursor;
      document.body.style.userSelect = prevSelect;
    };
  }, [isResizingGenius]);

  // Always maximized: keep size in sync with window
  useEffect(() => {
    const onResize = () => setSize(getMaximizedSize());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const selectedAlbum = selectedAlbumId ? albums.find((a) => a.id === selectedAlbumId) ?? null : null;
  const selectedTrack = selectedAlbum && selectedTrackId
    ? selectedAlbum.tracks.find((t) => t.id === selectedTrackId) ?? null
    : null;

  // Reset Now Playing elapsed time when track changes
  useEffect(() => {
    setNowPlayingElapsedSeconds(0);
  }, [selectedTrackId]);

  // Parse "M:SS" or "MM:SS" to total seconds (same logic as bottom bar)
  const parseDurationToSeconds = useCallback((s: string | undefined): number => {
    if (!s?.trim()) return 60;
    const [m, sec = "0"] = s.trim().split(":");
    return Number(m) * 60 + Number(sec) * 1 || 60;
  }, []);

  // Run playback timer when playing and a track is selected
  useEffect(() => {
    if (!isPlaying || !selectedTrack) return;
    const totalSeconds = parseDurationToSeconds(selectedTrack.duration);
    const interval = setInterval(() => {
      setNowPlayingElapsedSeconds((prev) => {
        if (prev >= totalSeconds) {
          setIsPlaying(false);
          return totalSeconds;
        }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying, selectedTrack, parseDurationToSeconds]);

  /** Format seconds as M:SS or MM:SS for Now Playing display */
  const formatTime = useCallback((seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  }, []);

  const handleSelectAlbum = useCallback((id: string) => {
    setSelectedAlbumId(id);
    setSelectedTrackId(null);
  }, []);

  const goToNextTrack = useCallback(() => {
    if (!selectedAlbum) return;
    const idx = selectedAlbum.tracks.findIndex((t) => t.id === selectedTrackId);
    if (idx < selectedAlbum.tracks.length - 1) {
      setSelectedTrackId(selectedAlbum.tracks[idx + 1].id);
    } else {
      const albumIdx = albums.findIndex((a) => a.id === selectedAlbum.id);
      if (albumIdx < albums.length - 1) {
        const nextAlbum = albums[albumIdx + 1];
        setSelectedAlbumId(nextAlbum.id);
        setSelectedTrackId(nextAlbum.tracks[0].id);
      } else {
        setSelectedTrackId(selectedAlbum.tracks[0].id);
      }
    }
  }, [selectedAlbum, selectedTrackId, albums]);

  const goToPrevTrack = useCallback(() => {
    if (!selectedAlbum) return;
    const idx = selectedAlbum.tracks.findIndex((t) => t.id === selectedTrackId);
    if (idx > 0) {
      setSelectedTrackId(selectedAlbum.tracks[idx - 1].id);
    } else {
      const albumIdx = albums.findIndex((a) => a.id === selectedAlbum.id);
      if (albumIdx > 0) {
        const prevAlbum = albums[albumIdx - 1];
        setSelectedAlbumId(prevAlbum.id);
        setSelectedTrackId(prevAlbum.tracks[prevAlbum.tracks.length - 1].id);
      } else {
        setSelectedTrackId(selectedAlbum.tracks[selectedAlbum.tracks.length - 1].id);
      }
    }
  }, [selectedAlbum, selectedTrackId, albums]);

  const windowRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (hidden || !selectedAlbum) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const el = e.target as Node;
      if (!windowRef.current?.contains(el)) return;
      if (e.key === " " || e.key === "ArrowRight") {
        e.preventDefault();
        goToNextTrack();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goToPrevTrack();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [hidden, selectedAlbum, goToNextTrack, goToPrevTrack]);

  const toolbarHeight = spec.toolbar.height;
  const statusBarHeight = spec.statusBar.height;
  const bottomBarHeight = statusBarHeight + 2 * BOTTOM_BAR_VERTICAL_PADDING;
  /** First row of top bar: menu items, iTunes title, window controls (same vertical height) */
  const topBarFirstRowHeight = 28;
  const contentHeight = size.height - topBarFirstRowHeight - toolbarHeight - bottomBarHeight;

  const bodyStyle: React.CSSProperties = {
    position: "fixed",
    left: 0,
    top: 0,
    width: size.width,
    height: size.height,
    display: hidden ? "none" : "flex",
    flexDirection: "column",
    fontFamily: spec.typography.fontFamily,
    fontSize: spec.typography.body.size,
    borderRadius: 0,
    boxShadow: "none",
    border: "none",
    overflow: "hidden",
    zIndex,
    ...style,
  };

  const trackCount = selectedAlbum?.tracks.length ?? 0;
  /** Parse "M:SS" or "MM:SS" to decimal minutes, or return 0. */
  const parseDurationToMinutes = (s: string | undefined): number => {
    if (!s?.trim()) return 0;
    const [m, sec = "0"] = s.trim().split(":");
    return Number(m) * 60 + Number(sec) * 1 || 0;
  };
  const totalRuntimeMinutes = selectedAlbum
    ? (selectedAlbum.tracks.reduce((sum, t) => sum + parseDurationToMinutes(t.duration), 0) / 60).toFixed(1).replace(".", ",")
    : "0,0";
  /** Stable random 0–100 with one decimal for bottom bar "size MB", per album. */
  const sizeMB = useMemo(
    () => (Math.floor(Math.random() * 1000) / 10).toFixed(1).replace(".", ","),
    [selectedAlbumId]
  );
  const bottomBarCenterText = selectedAlbum
    ? `${trackCount} songs, ${totalRuntimeMinutes} minutes, ${sizeMB} MB`
    : "0 songs, 0,0 minutes, 0,0 MB";

  return (
    <div
      ref={windowRef}
      style={bodyStyle}
      className="presentation-window"
      role="dialog"
      aria-label="iTunes"
      onMouseDown={(e) => {
        onBringToFront?.();
        if ((e.target as HTMLElement).closest(".presentation-window")) windowRef.current?.focus();
      }}
      tabIndex={-1}
    >
      {/* Top bar (reference: single gradient strip with row 1 = menus + title + window controls, row 2 = playback + now playing) */}
      <div
        role="presentation"
        className="flex flex-col flex-shrink-0 select-none border-b border-[#8a8d90]"
        style={{
          background: "linear-gradient(180deg, #E7E7E6 0%, #9DA0A2 100%)",
          cursor: "default",
        }}
      >
        {/* Row 1: Three columns so iTunes is always centered (left/right flex-1 equal width) */}
        <div
          className="flex items-center flex-shrink-0 px-2 w-full"
          style={{
            height: topBarFirstRowHeight,
            fontFamily: spec.typography.fontFamily,
            fontSize: spec.typography.body.size,
            color: "#333",
          }}
        >
          <div className="flex-1 min-w-0 flex items-center justify-start">
            <div className="flex items-center gap-5">
              <span className="cursor-pointer hover:underline">File</span>
              <span className="cursor-pointer hover:underline">Edit</span>
              <span className="cursor-pointer hover:underline">View</span>
              <span className="cursor-pointer hover:underline">Controls</span>
              <span className="cursor-pointer hover:underline">Store</span>
              <span className="cursor-pointer hover:underline">Advanced</span>
              <span className="cursor-pointer hover:underline">Help</span>
            </div>
          </div>
          <div className="flex-shrink-0 flex items-center justify-center px-2">
            <span className="truncate" style={{ fontSize: 16 }}>iTunes</span>
          </div>
          <div className="flex-1 min-w-0 flex items-center justify-end">
            <XPTitleBarButtons variant="light" onMinimize={onMinimize} onMaximize={() => {}} onClose={onClose} isMaximized={true} />
          </div>
        </div>

        {/* Row 2: Three-column layout; symmetric horizontal padding (pl-12 pr-12) so Now Playing center aligns with iTunes title */}
        <div
          className="flex items-center flex-shrink-0 pl-12 pr-12 box-border"
          style={{ height: toolbarHeight, gap: 0, paddingBottom: 8, paddingTop: 4 }}
        >
        {/* Left: playback + volume; 48px from left edge (pl-12); extra spacing before volume */}
        <div className="flex-1 min-w-0 flex items-center justify-start">
        <div className="flex items-center flex-shrink-0" style={{ gap: PLAYBACK_BTN.gap, marginRight: 48 }}>
          <button
            type="button"
            onClick={goToPrevTrack}
            aria-label="Previous"
            className="flex items-center justify-center rounded-full flex-shrink-0"
            style={{
              width: PLAYBACK_BTN.sizePrevNext,
              height: PLAYBACK_BTN.sizePrevNext,
              border: PLAYBACK_BTN.border,
              background: PLAYBACK_BTN.background,
              boxShadow: PLAYBACK_BTN.boxShadow,
            }}
          >
            <FaBackward size={PLAYBACK_BTN.iconSizePrevNext} color={PLAYBACK_BTN.iconColor} aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => setIsPlaying((p) => !p)}
            aria-label={isPlaying ? "Pause" : "Play"}
            className="flex items-center justify-center rounded-full flex-shrink-0"
            style={{
              width: PLAYBACK_BTN.sizePlayPause,
              height: PLAYBACK_BTN.sizePlayPause,
              border: PLAYBACK_BTN.border,
              background: PLAYBACK_BTN.background,
              boxShadow: PLAYBACK_BTN.boxShadow,
            }}
          >
            {isPlaying ? (
              <FaPause size={PLAYBACK_BTN.iconSizePlayPause} color={PLAYBACK_BTN.iconColor} aria-hidden />
            ) : (
              <FaPlay size={PLAYBACK_BTN.iconSizePlayPause} color={PLAYBACK_BTN.iconColor} aria-hidden />
            )}
          </button>
          <button
            type="button"
            onClick={goToNextTrack}
            aria-label="Next"
            className="flex items-center justify-center rounded-full flex-shrink-0"
            style={{
              width: PLAYBACK_BTN.sizePrevNext,
              height: PLAYBACK_BTN.sizePrevNext,
              border: PLAYBACK_BTN.border,
              background: PLAYBACK_BTN.background,
              boxShadow: PLAYBACK_BTN.boxShadow,
            }}
          >
            <FaForward size={PLAYBACK_BTN.iconSizePrevNext} color={PLAYBACK_BTN.iconColor} aria-hidden />
          </button>
        </div>
        {/* Volume — larger icons, taller/wider slider, thumb matches filled track grey */}
        <div className="flex items-center gap-3 flex-shrink-0" style={{ marginRight: 48 }}>
          <FaVolumeDown size={20} color="#555" aria-hidden />
          <div className="relative flex items-center" style={{ width: 120, height: 10 }}>
            <div
              className="absolute inset-0 rounded-full overflow-hidden"
              style={{
                background: "linear-gradient(180deg, #6e6e6e 0%, #5a5a5a 50%, #6e6e6e 100%)",
                boxShadow: "inset 0 1px 2px rgba(0,0,0,0.2)",
              }}
            />
            <div
              className="absolute left-0 top-0 bottom-0 rounded-l-full overflow-hidden"
              style={{
                width: "50%",
                background: "linear-gradient(180deg, #e8e8e8 0%, #d8d8d8 50%, #e0e0e0 100%)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.8)",
              }}
            />
            <div
              className="absolute left-[calc(50%-6px)] top-1/2 -translate-y-1/2 rounded-full flex-shrink-0 border border-[#a0a0a0]"
              style={{
                width: 12,
                height: 12,
                background: "linear-gradient(180deg, #e8e8e8 0%, #d8d8d8 50%, #e0e0e0 100%)",
                boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
              }}
            />
          </div>
          <FaVolumeUp size={22} color="#555" aria-hidden />
        </div>
        </div>
        {/* Center: Now Playing — symmetric padding so it's truly horizontally centered */}
        <div className="flex-shrink-0 flex items-center justify-center" style={{ paddingLeft: 32, paddingRight: 32 }}>
          <div
            className="flex flex-col items-center justify-center flex-shrink-0"
            style={{
              width: Math.min(size.width * 0.5, 600),
              minWidth: 340,
              background: gradient(spec.toolbar.center.nowPlaying.backgroundGradient),
              border: spec.toolbar.center.nowPlaying.border,
              borderRadius: spec.toolbar.center.nowPlaying.borderRadius,
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6), inset 0 -1px 0 rgba(0,0,0,0.06)",
              paddingTop: 5,
              paddingRight: 10,
              paddingBottom: 5,
              paddingLeft: 10,
            }}
          >
            <div className="w-full flex items-center gap-3 min-w-0">
              {/* Play — decorative only (non-interactive) */}
              <span
                className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center self-center pointer-events-none cursor-default"
                style={{
                  background: "linear-gradient(180deg, #6e6e6e 0%, #5a5a5a 50%, #6e6e6e 100%)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2)",
                  color: "#EAEDDB",
                }}
                aria-hidden
              >
                <FaPlay size={8} color="#EAEDDB" />
              </span>
              {/* Center: title, artist, progress row — dynamic from selected track and playback */}
              <div className="flex-1 flex flex-col items-center min-w-0">
                <div className="truncate w-full text-center leading-tight" style={{ fontSize: 12, fontWeight: "bold", color: spec.toolbar.center.nowPlaying.text.line2.color }}>{selectedTrack?.title ?? "—"}</div>
                <div className="truncate w-full text-center leading-tight mt-0.5" style={{ fontSize: 11, color: spec.toolbar.center.nowPlaying.text.line3.color }}>Andres Arbelaez</div>
                <div className="w-full pt-1.5 pb-0.5 px-0">
                  {(() => {
                    const totalSeconds = selectedTrack ? parseDurationToSeconds(selectedTrack.duration) : 60;
                    const elapsed = selectedTrackId ? nowPlayingElapsedSeconds : 0;
                    const progressPct = totalSeconds > 0 ? Math.min(100, (elapsed / totalSeconds) * 100) : 0;
                    const thumbLeftPct = Math.min(100, progressPct);
                    return (
                      <div className="flex items-center gap-2">
                        <span className="flex-shrink-0 w-7 text-right tabular-nums" style={{ fontSize: 10, color: "#888" }}>{formatTime(elapsed)}</span>
                        <div className="flex-1 min-w-0 flex items-center relative" style={{ height: 10 }}>
                          <div
                            className="absolute inset-0 rounded-full overflow-hidden"
                            style={{
                              background: "linear-gradient(180deg, #b0b0b0 0%, #a8a8a8 50%, #b0b0b0 100%)",
                              boxShadow: "inset 0 1px 2px rgba(0,0,0,0.12)",
                            }}
                          />
                          <div
                            className="absolute left-0 top-0 bottom-0 rounded-l-full overflow-hidden"
                            style={{
                              width: `${progressPct}%`,
                              background: "linear-gradient(180deg, #6e6e6e 0%, #5a5a5a 50%, #6e6e6e 100%)",
                              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2)",
                            }}
                          />
                          <div
                            className="absolute top-1/2 -translate-y-1/2 rotate-45 border border-[#808080] bg-white flex-shrink-0"
                            style={{ width: 8, height: 8, left: `calc(${thumbLeftPct}% - 4px)`, boxShadow: "0 1px 2px rgba(0,0,0,0.2)" }}
                          />
                        </div>
                        <span className="flex-shrink-0 w-7 text-left tabular-nums" style={{ fontSize: 10, color: "#888" }}>{selectedTrack ? formatTime(totalSeconds) : "0:00"}</span>
                      </div>
                    );
                  })()}
                </div>
              </div>
              {/* Repeat — decorative only (non-interactive) */}
              <span
                className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center self-center pointer-events-none cursor-default"
                style={{
                  background: "linear-gradient(180deg, #6e6e6e 0%, #5a5a5a 50%, #6e6e6e 100%)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2)",
                  color: "#EAEDDB",
                }}
                aria-hidden
              >
                <FaRedo size={8} color="#EAEDDB" />
              </span>
            </div>
          </div>
        </div>
        {/* Right: view + search */}
        <div className="flex-1 min-w-0 flex items-center justify-end">
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* View mode: list / grid / column — same grouped style as bottom bar; selected = dark fill + white icon */}
          <div className="flex overflow-hidden rounded border border-[#9a9890]" style={{ width: spec.toolbar.right.viewModeButtons.size * 3, height: spec.toolbar.right.viewModeButtons.size }}>
            <button
              type="button"
              aria-label="List view"
              aria-pressed={viewMode === "list"}
              onClick={() => setViewMode("list")}
              className="flex flex-1 items-center justify-center border-r border-[#9a9890] shrink-0"
              style={{
                width: spec.toolbar.right.viewModeButtons.size,
                height: spec.toolbar.right.viewModeButtons.size,
                background: viewMode === "list" ? "#5a5a5a" : BTN_EMBOSS,
              }}
            >
              <FaList size={14} color={viewMode === "list" ? "#fff" : "#555"} aria-hidden />
            </button>
            <button
              type="button"
              aria-label="Grid view"
              aria-pressed={viewMode === "grid"}
              onClick={() => setViewMode("grid")}
              className="flex flex-1 items-center justify-center border-r border-[#9a9890] shrink-0"
              style={{
                width: spec.toolbar.right.viewModeButtons.size,
                height: spec.toolbar.right.viewModeButtons.size,
                background: viewMode === "grid" ? "#5a5a5a" : BTN_EMBOSS,
              }}
            >
              <FaThLarge size={14} color={viewMode === "grid" ? "#fff" : "#555"} aria-hidden />
            </button>
            <button
              type="button"
              aria-label="Column view"
              aria-pressed={viewMode === "column"}
              onClick={() => setViewMode("column")}
              className="flex flex-1 items-center justify-center shrink-0"
              style={{
                width: spec.toolbar.right.viewModeButtons.size,
                height: spec.toolbar.right.viewModeButtons.size,
                background: viewMode === "column" ? "#5a5a5a" : BTN_EMBOSS,
              }}
            >
              <FaColumns size={14} color={viewMode === "column" ? "#fff" : "#555"} aria-hidden />
            </button>
          </div>
          {/* Search: pill (ellipse), magnifying glass left of text input */}
          <div
            className="flex items-center rounded-full bg-white border border-[#9a9890] overflow-hidden"
            style={{ width: spec.toolbar.right.searchBar.width, height: spec.toolbar.right.searchBar.height }}
          >
            <span className="flex items-center justify-center pl-2 text-[#555]" aria-hidden>
              <FaSearch size={14} />
            </span>
            <input
              type="text"
              placeholder="Search"
              readOnly
              className="flex-1 min-w-0 bg-transparent border-0 pl-1 pr-2 outline-none placeholder:text-neutral-400"
              style={{ height: spec.toolbar.right.searchBar.height, fontSize: spec.typography.body.size }}
            />
          </div>
        </div>
        </div>
        </div>
      </div>

      {/* 4. Body: left sidebar | (main + Genius sidebar overlay) */}
      <div className="flex flex-1 min-h-0" style={{ height: contentHeight }}>
        {/* Left sidebar — reference style: #D9DEE7 background, #92A5C3 selected, sections + dummy items with icons */}
        <div
          className="flex-shrink-0 flex flex-col border-r"
          style={{
            width: spec.leftSidebar.width,
            background: spec.leftSidebar.background ?? gradient(spec.leftSidebar.backgroundGradient),
            fontFamily: spec.typography.fontFamily,
            borderRightColor: "#c8c6be",
          }}
        >
          <div className="flex-1 overflow-auto py-0.5 min-h-0">
            {LEFT_SIDEBAR_SECTIONS.map((section, sectionIdx) => (
              <div key={section.title}>
                <div
                  className="font-bold uppercase tracking-wide border-b"
                  style={{
                    paddingTop: spec.leftSidebar.sectionHeader.paddingVertical,
                    paddingBottom: spec.leftSidebar.sectionHeader.paddingVertical,
                    paddingLeft: spec.leftSidebar.sectionHeader.paddingHorizontal,
                    paddingRight: spec.leftSidebar.sectionHeader.paddingHorizontal,
                    fontSize: Math.round(spec.leftSidebar.sectionHeader.fontSize * LEFT_SIDEBAR_SCALE),
                    color: spec.leftSidebar.sectionHeader.color,
                    borderBottom: spec.leftSidebar.sectionHeader.borderBottom,
                  }}
                >
                  {section.title}
                </div>
                {/* LIBRARY: artist row (topmost), then albums, then dummy items (Music, Movies, ...) */}
                {section.title === "LIBRARY" && (
                  <>
                    <button
                      type="button"
                      className="w-full text-left flex items-center gap-2 border-0 cursor-default"
                      style={{
                        paddingTop: spec.leftSidebar.item.paddingVertical,
                        paddingBottom: spec.leftSidebar.item.paddingVertical,
                        paddingLeft: SIDEBAR_LEFT_INDENT,
                        paddingRight: spec.leftSidebar.item.paddingHorizontal,
                        background: "transparent",
                        color: spec.leftSidebar.item.color,
                        fontSize: Math.round(spec.leftSidebar.item.fontSize * LEFT_SIDEBAR_SCALE),
                      }}
                    >
                      <FaUser
                        style={{
                          width: Math.round(spec.leftSidebar.item.iconSize * LEFT_SIDEBAR_SCALE),
                          height: Math.round(spec.leftSidebar.item.iconSize * LEFT_SIDEBAR_SCALE),
                          flexShrink: 0,
                          opacity: 0.85,
                        }}
                      />
                      <span className="truncate">Andres Arbelaez</span>
                    </button>
                    {albums.map((album) => {
                      const isSelected = selectedAlbumId === album.id;
                      return (
                        <button
                          key={album.id}
                          type="button"
                          onClick={() => handleSelectAlbum(album.id)}
                          className="w-full text-left flex items-center gap-2 border-0 cursor-pointer"
                        style={{
                          paddingTop: spec.leftSidebar.item.paddingVertical,
                          paddingBottom: spec.leftSidebar.item.paddingVertical,
                          paddingLeft: SIDEBAR_LEFT_INDENT,
                          paddingRight: spec.leftSidebar.item.paddingHorizontal,
                          background: isSelected ? spec.leftSidebar.item.selectedBackground : "transparent",
                          color: isSelected ? spec.leftSidebar.item.selectedColor : spec.leftSidebar.item.color,
                          fontSize: Math.round(spec.leftSidebar.item.fontSize * LEFT_SIDEBAR_SCALE),
                        }}
                      >
                        <FaWrench
                          style={{
                            width: Math.round(spec.leftSidebar.item.iconSize * LEFT_SIDEBAR_SCALE),
                            height: Math.round(spec.leftSidebar.item.iconSize * LEFT_SIDEBAR_SCALE),
                              flexShrink: 0,
                              opacity: isSelected ? 1 : 0.85,
                            }}
                          />
                          <span className="truncate">{album.title}</span>
                        </button>
                      );
                    })}
                  </>
                )}
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className="w-full text-left flex items-center gap-2 border-0 cursor-default"
                      style={{
                        paddingTop: spec.leftSidebar.item.paddingVertical,
                        paddingBottom: spec.leftSidebar.item.paddingVertical,
                        paddingLeft: SIDEBAR_LEFT_INDENT,
                        paddingRight: spec.leftSidebar.item.paddingHorizontal,
                        background: "transparent",
                        color: spec.leftSidebar.item.color,
                        fontSize: Math.round(spec.leftSidebar.item.fontSize * LEFT_SIDEBAR_SCALE),
                      }}
                    >
                      <Icon
                        style={{
                          width: Math.round(spec.leftSidebar.item.iconSize * LEFT_SIDEBAR_SCALE),
                          height: Math.round(spec.leftSidebar.item.iconSize * LEFT_SIDEBAR_SCALE),
                          flexShrink: 0,
                          opacity: 0.85,
                        }}
                      />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Main + Genius sidebar container: flex row so main content shrinks when sidebar is present (table resizes) */}
        <div ref={mainContentRef} className="flex-1 min-w-0 min-h-0 flex flex-row">
        {/* Main content — from spec; flex-1 so it takes space left of the sidebar */}
        <div className="flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden border-r border-[#b8b6ae]" style={{ background: spec.main.background }}>
          {selectedAlbum ? (
            <>
              <div className="flex-shrink-0 flex items-center border-b w-full" style={{ height: spec.main.headerBar.height, paddingLeft: spec.main.headerBar.paddingHorizontal, paddingRight: spec.main.headerBar.paddingHorizontal, paddingTop: spec.main.headerBar.paddingVertical, paddingBottom: spec.main.headerBar.paddingVertical, background: gradient(spec.main.headerBar.backgroundGradient), borderBottom: spec.main.headerBar.borderBottom }}>
                <div className="flex-1 min-w-0 flex items-center">
                  <span style={{ fontSize: Math.round(spec.main.headerBar.columnHeaderStyle.fontSize * CENTER_PANEL_FONT_SCALE), color: spec.colors.textPrimary, fontWeight: 600 }}>◀ All Artists</span>
                </div>
                <div className="flex-shrink-0 flex items-center justify-center px-2">
                  <span style={{ fontSize: Math.round(spec.main.headerBar.columnHeaderStyle.fontSize * CENTER_PANEL_FONT_SCALE), color: spec.colors.textPrimary, fontWeight: 600 }}>Andres Arbelaez</span>
                </div>
                <div className="flex-1 min-w-0" />
              </div>
              <div className="flex-shrink-0 font-bold" style={{ fontSize: Math.round(spec.main.artistTitle.fontSize * CENTER_PANEL_FONT_SCALE), paddingLeft: spec.main.artistTitle.paddingHorizontal, paddingRight: spec.main.artistTitle.paddingHorizontal, paddingTop: spec.main.artistTitle.paddingVertical, paddingBottom: spec.main.artistTitle.paddingVertical, color: spec.colors.textPrimary, borderBottom: spec.main.artistTitle.borderBottom }}>
                {selectedAlbum.title}
                {selectedAlbum.subtitle ? ` — ${selectedAlbum.subtitle}` : ""}
              </div>
              <div className="flex-1 min-h-0 flex overflow-hidden">
                <div className="flex-shrink-0 flex flex-col items-center border-r" style={{ width: spec.main.artworkSection.width, padding: spec.main.artworkSection.padding, borderRight: spec.colors.borderLight }}>
                  <div className="rounded bg-[#e0e0e0] flex items-center justify-center shadow-md" style={{ width: spec.main.artworkSection.artworkSize, height: spec.main.artworkSection.artworkSize, fontSize: Math.round(spec.typography.small.size * CENTER_PANEL_FONT_SCALE), color: "#999", boxShadow: "0 2px 6px rgba(0,0,0,0.15)" }}>
                    {selectedAlbum.albumArtUrl ? <img src={selectedAlbum.albumArtUrl} alt="" className="w-full h-full object-cover rounded" /> : "Artwork"}
                  </div>
                  <div className="mt-2 font-semibold text-center" style={{ fontSize: Math.round(12 * CENTER_PANEL_FONT_SCALE), color: spec.colors.textPrimary }}>{selectedAlbum.title}</div>
                  <div className="text-center" style={{ fontSize: Math.round(spec.typography.small.size * CENTER_PANEL_FONT_SCALE), color: spec.colors.textSecondary }}>{selectedAlbum.subtitle ?? ""}</div>
                  <div className="mt-1 text-yellow-600" style={{ fontSize: Math.round(14 * CENTER_PANEL_FONT_SCALE) }}>★★★★★</div>
                </div>
                <div className="flex-1 min-w-0 overflow-x-auto overflow-y-auto min-h-0" style={{ scrollbarGutter: "stable" }}>
                  <table
                    className="border-collapse w-full table-fixed min-w-0"
                    style={{
                      fontFamily: spec.typography.fontFamily,
                      fontSize: Math.round(spec.main.trackList.rowText.fontSize * CENTER_PANEL_FONT_SCALE),
                    }}
                  >
                    <colgroup>
                      <col style={{ width: "6%", maxWidth: 48 }} />
                      <col style={{ width: "34%" }} />
                      <col style={{ width: "10%" }} />
                      <col style={{ width: "38%" }} />
                      <col style={{ width: "12%" }} />
                    </colgroup>
                    <thead>
                      <tr style={{ background: "#FEFEFE", borderBottom: "1px solid #ddd" }}>
                        <th className="text-left py-1.5 px-2 font-bold" style={{ color: spec.main.headerBar.columnHeaderStyle.color, maxWidth: 48 }}></th>
                        <th className="text-left py-1.5 px-2 font-bold" style={{ color: spec.main.headerBar.columnHeaderStyle.color }}>Name</th>
                        <th className="text-left py-1.5 px-2 font-bold" style={{ color: spec.main.headerBar.columnHeaderStyle.color }}>Time</th>
                        <th className="text-left py-1.5 px-2 font-bold" style={{ color: spec.main.headerBar.columnHeaderStyle.color }}>Album</th>
                        <th className="text-left py-1.5 px-2 font-bold" style={{ color: spec.main.headerBar.columnHeaderStyle.color }}>Genre</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedAlbum.tracks.map((track, index) => {
                        const isSelected = selectedTrackId === track.id;
                        const altBg = spec.main.trackList.alternatingRowBackgrounds as string[] | undefined;
                        const rowBg = isSelected
                          ? spec.main.trackList.selectedRowBackground
                          : altBg?.[index % 2] ?? (index % 2 === 0 ? "#F3F7FB" : "#FFFFFF");
                        const rowColor = isSelected ? (spec.main.trackList.selectedRowTextColor ?? "#ffffff") : spec.colors.textPrimary;
                        const rowColorSecondary = isSelected ? (spec.main.trackList.selectedRowTextColor ?? "#ffffff") : spec.colors.textSecondary;
                        return (
                          <tr
                            key={track.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => setSelectedTrackId(track.id)}
                            onKeyDown={(e) => e.key === "Enter" && setSelectedTrackId(track.id)}
                            className="cursor-pointer"
                            style={{
                              height: spec.main.trackList.rowHeight,
                              background: rowBg,
                              color: rowColor,
                              borderBottom: spec.main.trackList.separator,
                            }}
                          >
                            <td className="py-1 px-2 text-center truncate" style={{ color: rowColorSecondary, maxWidth: 48 }}>{index + 1}</td>
                            <td className="py-1 px-2 truncate" style={{ color: rowColor }}>{track.title}</td>
                            <td className="py-1 px-2 truncate" style={{ color: rowColorSecondary }}>{track.duration ?? "—:—"}</td>
                            <td className="py-1 px-2 truncate" style={{ color: rowColorSecondary }}>{selectedAlbum.title}</td>
                            <td className="py-1 px-2 truncate" style={{ color: rowColorSecondary }}>Portfolio</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center" style={{ fontSize: Math.round(spec.typography.body.size * CENTER_PANEL_FONT_SCALE), color: spec.colors.textSecondary }}>Select an album</div>
          )}
        </div>

        {/* Genius sidebar — resizable; same fill as left sidebar */}
        <div
          className="relative flex-shrink-0 flex flex-col overflow-hidden select-none border-l"
          style={{
            width: geniusSidebarWidth,
            minWidth: 120,
            background: spec.leftSidebar.background ?? gradient(spec.leftSidebar.backgroundGradient),
            borderLeft: spec.rightSidebar.borderLeft,
            fontFamily: spec.typography.fontFamily,
          }}
        >
          <div
            role="separator"
            aria-label="Resize Genius sidebar"
            className="absolute left-0 top-0 bottom-0 z-10 cursor-col-resize hover:bg-black/10"
            style={{ width: 6 }}
            onMouseDown={(e) => {
              e.preventDefault();
              resizeStartRef.current = { x: e.clientX, w: geniusSidebarWidth };
              setIsResizingGenius(true);
            }}
          />
          <div className="flex-shrink-0 font-bold border-b" style={{ paddingTop: spec.rightSidebar.header.paddingVertical, paddingBottom: spec.rightSidebar.header.paddingVertical, paddingLeft: spec.rightSidebar.header.paddingHorizontal, paddingRight: spec.rightSidebar.header.paddingHorizontal, fontSize: spec.rightSidebar.header.fontSize, color: spec.rightSidebar.header.color, borderBottom: spec.rightSidebar.header.borderBottom }}>Genius Sidebar</div>
          {selectedTrack ? (
            <div className="flex-1 min-h-0 overflow-auto text-[#333]" style={{ padding: spec.rightSidebar.content.padding, fontSize: spec.rightSidebar.content.bodyText.fontSize, lineHeight: spec.rightSidebar.content.bodyText.lineHeight }}>
                {detailTab === "about" ? (
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                      a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-[#3d7bc2] underline">{children}</a>,
                      strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                      ul: ({ children }) => <ul className="list-disc pl-4 my-1">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal pl-4 my-1">{children}</ol>,
                      li: ({ children }) => <li>{children}</li>,
                      code: ({ children }) => <code className="bg-[#e0e0e0] px-0.5 rounded">{children}</code>,
                    }}
                  >
                    {selectedTrack.about}
                  </ReactMarkdown>
                ) : (
                  <div>
                    {selectedTrack.work.length === 0 ? <p className="text-[#666]">No assets yet.</p> : selectedTrack.work.map((asset, i) => <WorkAssetBlock key={i} asset={asset} />)}
                  </div>
                )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-4 text-center" style={{ fontSize: spec.typography.body.size, color: spec.colors.textSecondary }}>
              <div className="w-16 h-16 mb-3 rounded-full border-2 border-[#a0a0c0] flex items-center justify-center text-2xl text-[#9090b0]">⚛</div>
              <p className="font-semibold text-[#555] mb-1">Track details</p>
              <p>Select a track to see About and Work.</p>
            </div>
          )}
        </div>
        </div>
      </div>

      {/* 5. Bottom bar — full width: left buttons, center status string, right About/Work tab buttons */}
      <div
        className="flex-shrink-0 flex items-center justify-between w-full"
        style={{
          height: bottomBarHeight,
          paddingTop: BOTTOM_BAR_VERTICAL_PADDING,
          paddingBottom: BOTTOM_BAR_VERTICAL_PADDING,
          background: "#B8BABC",
          borderTop: spec.statusBar.borderTop,
          fontFamily: spec.typography.fontFamily,
          fontSize: spec.statusBar.statsText.fontSize,
        }}
      >
        {/* Left: add, shuffle, cycle, eject — grouped with no gap, single border */}
        <div style={{ paddingLeft: BOTTOM_BAR_LEFT_INDENT }}>
          <div className="flex overflow-hidden rounded border border-[#9a9890]" style={{ width: BOTTOM_BAR_BTN.width * 4, height: BOTTOM_BAR_BTN.height }}>
            <button type="button" aria-label="Add" className="flex flex-1 items-center justify-center border-r border-[#9a9890] text-[#555] shrink-0" style={{ width: BOTTOM_BAR_BTN.width, height: BOTTOM_BAR_BTN.height, background: BTN_EMBOSS }}>
              <FaPlus size={13} aria-hidden />
            </button>
            <button type="button" aria-label="Shuffle" className="flex flex-1 items-center justify-center border-r border-[#9a9890] text-[#555] shrink-0" style={{ width: BOTTOM_BAR_BTN.width, height: BOTTOM_BAR_BTN.height, background: BTN_EMBOSS }}>
              <FaRandom size={12} aria-hidden />
            </button>
            <button type="button" aria-label="Cycle" className="flex flex-1 items-center justify-center border-r border-[#9a9890] text-[#555] shrink-0" style={{ width: BOTTOM_BAR_BTN.width, height: BOTTOM_BAR_BTN.height, background: BTN_EMBOSS }}>
              <FaRedo size={12} aria-hidden />
            </button>
            <button type="button" aria-label="Eject" className="flex flex-1 items-center justify-center text-[#555] shrink-0" style={{ width: BOTTOM_BAR_BTN.width, height: BOTTOM_BAR_BTN.height, background: BTN_EMBOSS }}>
              <FaEject size={12} aria-hidden />
            </button>
          </div>
        </div>
        {/* Center: dynamic status string */}
        <div className="flex-1 min-w-0 flex items-center justify-center px-2">
          <span className="truncate" style={{ fontSize: 14, color: "#000000" }}>{bottomBarCenterText}</span>
        </div>
        {/* Right: About (atom) and Work (play) — grouped, tabbed (selected = darker icon + lighter bg), more space from edge */}
        <div style={{ paddingRight: BOTTOM_BAR_RIGHT_PADDING }}>
          <div className="flex overflow-hidden rounded border border-[#9a9890]" style={{ width: BOTTOM_BAR_BTN.width * 2, height: BOTTOM_BAR_BTN.height }}>
            <button
              type="button"
              aria-label="About"
              aria-pressed={detailTab === "about"}
              onClick={() => setDetailTab("about")}
              className="flex flex-1 items-center justify-center border-r border-[#9a9890] shrink-0"
              style={{
                width: BOTTOM_BAR_BTN.width,
                height: BOTTOM_BAR_BTN.height,
                background: detailTab === "about" ? "rgba(255,255,255,0.6)" : BTN_EMBOSS,
              }}
            >
              <FaAtom size={12} color={detailTab === "about" ? "#333" : "#999"} aria-hidden />
            </button>
            <button
              type="button"
              aria-label="Work"
              aria-pressed={detailTab === "work"}
              onClick={() => setDetailTab("work")}
              className="flex flex-1 items-center justify-center shrink-0"
              style={{
                width: BOTTOM_BAR_BTN.width,
                height: BOTTOM_BAR_BTN.height,
                background: detailTab === "work" ? "rgba(255,255,255,0.6)" : BTN_EMBOSS,
              }}
            >
              <FaPlay size={11} color={detailTab === "work" ? "#333" : "#999"} aria-hidden />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
