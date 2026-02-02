"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { iconPath } from "@/lib/icons";
import { FONT_XP_UI, FONT_NOTEPAD, FONT_SIZE_XP } from "@/lib/xp-fonts";
import type { Project } from "@/types/project";

const XP_TITLE_GRADIENT = "linear-gradient(180deg, #0054e3 0%, #0047d0 50%, #003cba 100%)";

/** Fallback Notepad/document icon for title bar (used when notepad.ico fails) */
function NotepadIconSvg({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" width={16} height={16} className={className} fill="none" stroke="currentColor" strokeWidth="1">
      <rect x="1.5" y="1.5" width="13" height="13" rx="0.5" />
      <line x1="4" y1="4.5" x2="12" y2="4.5" />
      <line x1="4" y1="7" x2="12" y2="7" />
      <line x1="4" y1="9.5" x2="12" y2="9.5" />
      <line x1="4" y1="12" x2="9" y2="12" />
    </svg>
  );
}

/** Formats a project as Markdown for the content area (supports **bold**, *italic*, links, etc.) */
function projectToNotepadMarkdown(project: Project): string {
  const sections: string[] = [
    `# ${project.title}`,
    "",
    "## Summary",
    project.summary,
    "",
  ];
  
  if (project.context) {
    sections.push("## Context", project.context, "");
  }
  
  if (project["the problem"]) {
    sections.push("## The Problem", project["the problem"], "");
  }
  
  if (project["the solution"]) {
    sections.push("## The Solution", project["the solution"], "");
  }
  
  if (project["My Role"]) {
    sections.push("## My Role", project["My Role"], "");
  }
  
  if (project.Impact) {
    sections.push("## Impact", project.Impact, "");
  }
  
  sections.push("## Skills", project.skills.length > 0 ? project.skills.join(", ") : "(none listed)", "");
  
  if (project["Tools Used"] && project["Tools Used"].length > 0) {
    sections.push("## Tools Used", project["Tools Used"].join(", "), "");
  }
  
  if (project["Tech Stack"] && project["Tech Stack"].length > 0) {
    sections.push("## Tech Stack", project["Tech Stack"].join(", "), "");
  }
  
  // Images and videos will be rendered separately before markdown content
  
  if (project.notes) {
    sections.push("## Notes", project.notes, "");
  }
  
  // Only add Link section if URL is not "NA"
  if (project.url && project.url !== "NA") {
    sections.push("## Link", `[${project.url}](${project.url})`);
  }
  
  // Note: evidence is intentionally NOT rendered - it's only used for agent context
  return sections.join("\n");
}

/** Returns YouTube embed URL if the given URL is YouTube, otherwise null. */
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

type NotepadWindowProps = {
  project: Project | null;
  onClose: () => void;
  onMinimize?: () => void;
  hidden?: boolean;
  style?: React.CSSProperties;
  /** Z-index when this window is in front; parent controls based on last click. */
  zIndex?: number;
  /** Call when the window is clicked so parent can bring it to front. */
  onBringToFront?: () => void;
};

const NOTEPAD_WIDTH = 680;
const NOTEPAD_HEIGHT = 520;
const MIN_WIDTH = 280;
const MIN_HEIGHT = 200;

export function NotepadWindow({
  project,
  onClose,
  onMinimize,
  hidden = false,
  style,
  zIndex = 45,
  onBringToFront,
}: NotepadWindowProps) {
  const [pos, setPos] = useState({ x: 120, y: 100 });
  const [size, setSize] = useState({ width: NOTEPAD_WIDTH, height: NOTEPAD_HEIGHT });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [useNotepadIconFallback, setUseNotepadIconFallback] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, left: 0, top: 0 });
  const resizeStart = useRef({ x: 0, y: 0, width: 0, height: 0 });

  const handleTitleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest("button")) return;
      setIsDragging(true);
      dragStart.current = { x: e.clientX, y: e.clientY, left: pos.x, top: pos.y };
    },
    [pos.x, pos.y]
  );

  useEffect(() => {
    if (!isDragging && !isResizing) return;
    const onMove = (e: MouseEvent) => {
      if (isDragging) {
        const dx = e.clientX - dragStart.current.x;
        const dy = e.clientY - dragStart.current.y;
        const w = typeof window !== "undefined" ? window.innerWidth : 800;
        const h = typeof window !== "undefined" ? window.innerHeight : 600;
        setPos({
          x: Math.max(0, Math.min(w - size.width, dragStart.current.left + dx)),
          y: Math.max(0, Math.min(h - 120, dragStart.current.top + dy)),
        });
      } else if (isResizing) {
        const dx = e.clientX - resizeStart.current.x;
        const dy = e.clientY - resizeStart.current.y;
        const w = typeof window !== "undefined" ? window.innerWidth : 800;
        const h = typeof window !== "undefined" ? window.innerHeight : 600;
        const newWidth = Math.max(MIN_WIDTH, Math.min(w - pos.x, resizeStart.current.width + dx));
        const newHeight = Math.max(MIN_HEIGHT, Math.min(h - pos.y - 40, resizeStart.current.height + dy));
        setSize({ width: newWidth, height: newHeight });
      }
    };
    const onUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [isDragging, isResizing, size.width, pos.x, pos.y]);

  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsResizing(true);
      resizeStart.current = { x: e.clientX, y: e.clientY, width: size.width, height: size.height };
    },
    [size.width, size.height]
  );

  const title = project ? `${project.title} - Notepad` : "Untitled - Notepad";
  const bodyMarkdown = project ? projectToNotepadMarkdown(project) : "";

  const containerStyle: React.CSSProperties = {
    position: "fixed",
    left: pos.x,
    top: pos.y,
    width: size.width,
    height: size.height,
    minWidth: MIN_WIDTH,
    minHeight: MIN_HEIGHT,
    display: hidden ? "none" : "flex",
    flexDirection: "column",
    fontFamily: FONT_XP_UI,
    fontSize: FONT_SIZE_XP.title,
    borderRadius: "8px 8px 0 0",
    boxShadow: "2px 2px 10px rgba(0,0,0,0.35)",
    border: "1px solid #003cda",
    overflow: "hidden",
    zIndex,
    ...style,
  };

  return (
    <div style={containerStyle} className="notepad-window" role="dialog" aria-label={title} onMouseDown={onBringToFront}>
      {/* Title bar */}
      <div
        role="presentation"
        onMouseDown={handleTitleMouseDown}
        className="flex items-center justify-between pl-2 pr-1 h-7 cursor-move select-none flex-shrink-0 text-white"
        style={{
          background: XP_TITLE_GRADIENT,
          borderBottom: "1px solid #003cda",
        }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex-shrink-0 text-white [&_svg]:text-white">
            {useNotepadIconFallback ? (
              <NotepadIconSvg />
            ) : (
              <img src={iconPath("notepad")} alt="" width={16} height={16} onError={() => setUseNotepadIconFallback(true)} style={{ display: "block" }} />
            )}
          </span>
          <span className="truncate">{title}</span>
        </div>
        <div className="flex items-center flex-shrink-0">
          <button
            type="button"
            aria-label="Minimize"
            onClick={onMinimize}
            className="w-6 h-5 flex items-center justify-center text-white hover:bg-white/20 border border-transparent rounded-sm"
          >
            −
          </button>
          <button
            type="button"
            aria-label="Maximize"
            className="w-6 h-5 flex items-center justify-center text-white hover:bg-white/20 border border-transparent rounded-sm"
          >
            □
          </button>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="w-6 h-5 flex items-center justify-center text-white hover:bg-red-600 border border-transparent rounded-sm"
          >
            ×
          </button>
        </div>
      </div>

      {/* Menu bar */}
      <div
        className="flex items-center gap-5 pl-3 h-6 flex-shrink-0 bg-[#ece9d8] border-b border-[#ccc]"
        style={{ fontFamily: FONT_XP_UI, fontSize: FONT_SIZE_XP.standard }}
      >
        <span className="cursor-pointer hover:underline">File</span>
        <span className="cursor-pointer hover:underline">Edit</span>
        <span className="cursor-pointer hover:underline">Format</span>
        <span className="cursor-pointer hover:underline">View</span>
        <span className="cursor-pointer hover:underline">Help</span>
      </div>

      {/* Content area — white, scrollable, Markdown-rendered (XP Notepad used monospace) */}
      <div
        className="flex-1 min-h-0 bg-white border-b border-[#ccc] overflow-auto text-neutral-800"
        style={{ fontFamily: FONT_NOTEPAD, fontSize: FONT_SIZE_XP.title }}
      >
        {bodyMarkdown ? (
          <div className="p-3 [&>*:last-child]:mb-0">
            {/* Render images first if present */}
            {project && project.images && project.images.length > 0 && (
              <div className="mb-4">
                {project.images.map((imgUrl, index) => (
                  <img
                    key={index}
                    src={imgUrl}
                    alt="Project image"
                    className="max-w-full h-auto my-4 rounded border border-neutral-300"
                    style={{ maxHeight: "500px" }}
                  />
                ))}
              </div>
            )}
            
            {/* Render videos second if present */}
            {project && project.videos && project.videos.length > 0 && (
              <div className="mb-4">
                {project.videos.map((videoUrl, index) => {
                  const youtubeEmbed = getYouTubeEmbedUrl(videoUrl);
                  if (youtubeEmbed) {
                    return (
                      <div key={index} className="my-4">
                        <div className="relative w-full rounded border border-neutral-300 overflow-hidden" style={{ aspectRatio: "16/9", maxHeight: "400px" }}>
                          <iframe
                            src={youtubeEmbed}
                            title={`Video ${index + 1}`}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                            className="absolute inset-0 w-full h-full"
                          />
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div key={index} className="my-4 notepad-video-wrapper group">
                      <video
                        src={videoUrl}
                        controls
                        autoPlay
                        muted
                        loop
                        className="max-w-full h-auto rounded border border-neutral-300"
                        style={{ maxHeight: "400px" }}
                      >
                        Your browser does not support the video tag.
                      </video>
                      <p className="text-xs text-neutral-500 mt-1">
                        <a href={videoUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                          Open video in new tab
                        </a>
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
            
            {/* Render markdown content (title and all other sections) */}
            <ReactMarkdown
              components={{
                h1: ({ children }) => <h1 className="text-lg font-semibold mt-0 mb-2">{children}</h1>,
                h2: ({ children }) => <h2 className="text-base font-semibold mt-3 mb-1">{children}</h2>,
                p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                a: ({ href, children }) => (
                  <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">
                    {children}
                  </a>
                ),
                ul: ({ children }) => <ul className="list-disc pl-5 my-2 space-y-0.5">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-5 my-2 space-y-0.5">{children}</ol>,
                li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                em: ({ children }) => <em>{children}</em>,
                code: ({ children }) => <code className="bg-neutral-100 px-1 rounded text-sm">{children}</code>,
              }}
            >
              {bodyMarkdown}
            </ReactMarkdown>
          </div>
        ) : (
          <div className="p-3 text-neutral-400">(No project opened — open a folder from the desktop.)</div>
        )}
      </div>

      {/* Bottom scrollbar hint / status — XP Notepad often had a status strip; we use simple border */}
      <div className="h-0.5 flex-shrink-0 bg-[#ece9d8] relative" aria-hidden>
        {/* Resize handle - Windows XP style diagonal lines */}
        <div
          onMouseDown={handleResizeMouseDown}
          className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize hover:bg-white/20"
          style={{
            backgroundImage: "repeating-linear-gradient(135deg, transparent, transparent 2px, #999 2px, #999 3px)",
            backgroundSize: "8px 8px",
          }}
          title="Resize"
        />
      </div>
    </div>
  );
}
