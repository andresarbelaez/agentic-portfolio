"use client";

import { useState, useEffect } from "react";
import type { Project } from "@/types/project";
import { iconPath } from "@/lib/icons";
import { FONT_XP_UI } from "@/lib/xp-fonts";
import { AIMChatWindow } from "./AIMChatWindow";
import { AIMSignOnWindow } from "./AIMSignOnWindow";
import { NotepadWindow } from "./NotepadWindow";

function FolderIconSvg({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      width="32"
      height="32"
    >
      <path
        fill="#F5C742"
        stroke="#B8860B"
        strokeWidth="0.5"
        d="M2 6v20h28V10H14l-2-2H2zm0 2h9.17l2 2H28v14H4V8z"
      />
      <path fill="#E5A90A" d="M2 6h10l2 2h16v2H4V6z" />
    </svg>
  );
}

function FolderIcon({ className }: { className?: string }) {
  const [useFallback, setUseFallback] = useState(false);
  if (useFallback) return <FolderIconSvg className={className} />;
  return (
    <img
      src={iconPath("folder")}
      alt=""
      className={className}
      width={32}
      height={32}
      onError={() => setUseFallback(true)}
    />
  );
}

function AOLIcon({ className }: { className?: string }) {
  const [useFallback, setUseFallback] = useState(false);
  if (useFallback) {
    // Fallback: yellow "A" box similar to AIM window title bar
    return (
      <div className={`${className} w-8 h-8 bg-yellow-400 rounded-sm flex items-center justify-center text-xs font-bold text-black`}>
        A
      </div>
    );
  }
  return (
    <img
      src={iconPath("aol")}
      alt="AOL Instant Messenger"
      className={className}
      width={32}
      height={32}
      onError={() => setUseFallback(true)}
    />
  );
}

function FileIconSvg({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      width="32"
      height="32"
    >
      <path
        fill="#FFFFFF"
        stroke="#808080"
        strokeWidth="0.5"
        d="M6 4v24h20V10H16l-2-2H6zm0 2h7.17l2 2H24v18H8V6z"
      />
      <path fill="#E0E0E0" d="M6 4h8l2 2h10v2H8v18h16V10H16l-2-2H6z" />
    </svg>
  );
}

function FileIcon({ className }: { className?: string }) {
  const [useFallback, setUseFallback] = useState(false);
  if (useFallback) return <FileIconSvg className={className} />;
  return (
    <img
      src={iconPath("file")}
      alt="Resume"
      className={className}
      width={32}
      height={32}
      onError={() => setUseFallback(true)}
    />
  );
}

export function DesktopShell({ projects }: { projects: Project[] }) {
  const [aimMinimized, setAimMinimized] = useState(false);
  const [aimClosed, setAimClosed] = useState(false);
  // Start with chat open; Sign On flow is hidden (code kept below, gated by !loggedIn).
  const [loggedIn, setLoggedIn] = useState(true);
  const [screenName, setScreenName] = useState("website_visitor_1");
  const [notepadProject, setNotepadProject] = useState<Project | null>(null);
  const [notepadMinimized, setNotepadMinimized] = useState(false);
  const [useStartIconFallback, setUseStartIconFallback] = useState(false);
  const [useWindowsXPIconFallback, setUseWindowsXPIconFallback] = useState(false);
  const [useAimTaskbarFallback, setUseAimTaskbarFallback] = useState(false);
  const [useNotepadTaskbarFallback, setUseNotepadTaskbarFallback] = useState(false);
  // Which window is on top when both are open; last-clicked wins.
  const [frontWindow, setFrontWindow] = useState<"aim" | "notepad">("aim");
  const [currentTime, setCurrentTime] = useState("1:00 PM");
  // Key to reset chat when reopening
  const [aimChatKey, setAimChatKey] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(800);

  useEffect(() => {
    const updateViewportHeight = () => {
      setViewportHeight(window.innerHeight);
    };
    updateViewportHeight();
    window.addEventListener("resize", updateViewportHeight);
    return () => window.removeEventListener("resize", updateViewportHeight);
  }, []);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const ampm = hours >= 12 ? "PM" : "AM";
      const displayHours = hours % 12 || 12;
      const displayMinutes = minutes.toString().padStart(2, "0");
      setCurrentTime(`${displayHours}:${displayMinutes} ${ampm}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="h-screen w-full relative bg-[#6BA43A] bg-cover bg-center bg-no-repeat overflow-hidden"
      style={{ backgroundImage: "url(/bliss.jpg)" }}
    >
      {/* Desktop folder grid — click opens Notepad with that project */}
      <div
        className="pt-4 pl-4"
        style={{
          display: "grid",
          gridAutoFlow: "column",
          // Row count accounts for 80px rows + 12px row gap so items don't get cut off; overflow goes to next column
          gridTemplateRows: `repeat(${Math.max(1, Math.floor((viewportHeight - 88) / 92))}, 80px)`,
          gridAutoColumns: "max-content",
          justifyContent: "start",
          gap: "12px 16px",
          alignContent: "start",
        }}
      >
        {/* AOL Instant Messenger desktop icon */}
        <button
          type="button"
          onClick={() => {
            setLoggedIn(true);
            setAimClosed(false);
            setAimMinimized(false);
            setFrontWindow("aim");
            // Reset chat by incrementing key
            setAimChatKey((k) => k + 1);
          }}
          className="flex flex-col items-center w-20 group border-0 bg-transparent p-0 cursor-pointer"
        >
          <div className="flex justify-center items-center w-14 h-14 rounded group-hover:bg-white/20 transition-colors">
            <AOLIcon className="drop-shadow-md" />
          </div>
          <span
            className="text-xs mt-1 text-white text-center max-w-full truncate px-1"
            style={{
              textShadow: "-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 0 2px #000, 0 0 2px #000",
            }}
          >
            AOL Instant Messenger
          </span>
        </button>

        {/* Resume file icon */}
        <button
          type="button"
          onClick={() => {
            window.open("https://resume-beige-mu.vercel.app/resume.pdf", "_blank", "noopener,noreferrer");
          }}
          className="flex flex-col items-center w-20 group border-0 bg-transparent p-0 cursor-pointer"
        >
          <div className="flex justify-center items-center w-14 h-14 rounded group-hover:bg-white/20 transition-colors">
            <FileIcon className="drop-shadow-md" />
          </div>
          <span
            className="text-xs mt-1 text-white text-center max-w-full truncate px-1"
            style={{
              textShadow: "-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 0 2px #000, 0 0 2px #000",
            }}
          >
            Resume
          </span>
        </button>

        {/* Project folders */}
        {projects.map((p) => (
          <button
            key={p.slug}
            type="button"
            onClick={() => {
              setNotepadProject(p);
              setNotepadMinimized(false);
              setFrontWindow("notepad");
            }}
            className="flex flex-col items-center w-20 group border-0 bg-transparent p-0 cursor-pointer"
          >
            <div className="flex justify-center items-center w-14 h-14 rounded group-hover:bg-white/20 transition-colors">
              <FolderIcon className="drop-shadow-md" />
            </div>
            <span
              className="text-xs mt-1 text-white text-center max-w-full truncate px-1"
              style={{
                textShadow: "-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 0 2px #000, 0 0 2px #000",
              }}
            >
              {p.title}
            </span>
          </button>
        ))}
      </div>

      {/* Notepad — shows project content when a folder is opened */}
      {notepadProject !== null && (
        <NotepadWindow
          project={notepadProject}
          onClose={() => setNotepadProject(null)}
          onMinimize={() => setNotepadMinimized(true)}
          hidden={notepadMinimized}
          zIndex={frontWindow === "notepad" ? 55 : 45}
          onBringToFront={() => setFrontWindow("notepad")}
        />
      )}

      {/* AOL Sign On — hidden when starting with chat open; kept for possible future flow */}
      {!loggedIn && (
        <AIMSignOnWindow
          onSignOnSuccess={(name) => {
            setScreenName(name || "website_visitor_1");
            setLoggedIn(true);
          }}
        />
      )}

      {/* AIM chat window — visible only after sign-on */}
      {loggedIn && !aimClosed && (
        <AIMChatWindow
          screenName={screenName}
          onMinimize={() => setAimMinimized(true)}
          onClose={() => setAimClosed(true)}
          hidden={aimMinimized}
          zIndex={frontWindow === "aim" ? 55 : 50}
          onBringToFront={() => setFrontWindow("aim")}
          chatKey={aimChatKey}
        />
      )}

      {/* XP-style taskbar */}
      <div
        className="fixed bottom-0 left-0 right-0 h-9 flex items-center px-1 border-t border-[#003cda]"
        style={{
          background: "linear-gradient(180deg, #0054e3 0%, #0047d0 50%, #003cba 100%)",
          fontFamily: FONT_XP_UI,
        }}
      >
        <button
          type="button"
          className="h-7 px-4 flex items-center gap-2 text-white text-sm font-bold shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_1px_2px_rgba(0,0,0,0.3)] rounded-md hover:brightness-110 transition-all"
          style={{
            background: "linear-gradient(180deg, #8bc34a 0%, #7cb342 30%, #558b2f 70%, #33691e 100%)",
            border: "1px solid #2e7d32",
            borderRadius: "6px",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3), 0 1px 2px rgba(0,0,0,0.3)",
          }}
        >
          {useWindowsXPIconFallback ? (
            useStartIconFallback ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-white">
                <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 18c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z" />
              </svg>
            ) : (
              <img src={iconPath("start")} alt="" width={20} height={20} onError={() => setUseStartIconFallback(true)} className="object-contain" />
            )
          ) : (
            <img
              src={iconPath("windowsxp")}
              alt=""
              width={20}
              height={20}
              onError={() => setUseWindowsXPIconFallback(true)}
              className="object-contain flex-shrink-0"
            />
          )}
          <span className="whitespace-nowrap">start</span>
        </button>
        {loggedIn && aimMinimized && (
          <button
            type="button"
            onClick={() => {
              setAimClosed(false);
              setAimMinimized(false);
              setFrontWindow("aim");
              // Reset chat by incrementing key
              setAimChatKey((k) => k + 1);
            }}
            className="h-7 px-3 flex items-center gap-1.5 border border-[#1a5fd4] rounded-sm text-white text-sm font-bold shadow-sm hover:brightness-110"
            style={{
              background: "linear-gradient(180deg, #3a6ea5 0%, #2d5a87 100%)",
            }}
          >
            {useAimTaskbarFallback ? (
              <span className="w-4 h-4 flex-shrink-0 bg-yellow-400 rounded-sm flex items-center justify-center text-[10px] font-bold text-black">A</span>
            ) : (
              <img src={iconPath("aim")} alt="" width={16} height={16} onError={() => setUseAimTaskbarFallback(true)} className="w-4 h-4 flex-shrink-0 object-contain" />
            )}
            AIM – {screenName}
          </button>
        )}
        {notepadProject !== null && notepadMinimized && (
          <button
            type="button"
            onClick={() => {
              setNotepadMinimized(false);
              setFrontWindow("notepad");
            }}
            className="h-7 px-3 flex items-center gap-1.5 border border-[#1a5fd4] rounded-sm text-white text-sm font-bold shadow-sm hover:brightness-110"
            style={{
              background: "linear-gradient(180deg, #3a6ea5 0%, #2d5a87 100%)",
            }}
          >
            {useNotepadTaskbarFallback ? (
              <span className="w-4 h-4 flex-shrink-0 bg-white rounded-sm flex items-center justify-center">
                <svg viewBox="0 0 16 16" width={12} height={12} fill="none" stroke="currentColor" strokeWidth="1">
                  <rect x="1.5" y="1.5" width="13" height="13" rx="0.5" />
                  <line x1="4" y1="4.5" x2="12" y2="4.5" />
                  <line x1="4" y1="7" x2="12" y2="7" />
                  <line x1="4" y1="9.5" x2="9" y2="9.5" />
                </svg>
              </span>
            ) : (
              <img src={iconPath("notepad")} alt="" width={16} height={16} onError={() => setUseNotepadTaskbarFallback(true)} className="w-4 h-4 flex-shrink-0 object-contain" />
            )}
            {notepadProject.title} – Notepad
          </button>
        )}
        <div className="flex-1" />
        <div className="text-white/90 text-xs pr-2">{currentTime}</div>
      </div>
    </div>
  );
}
