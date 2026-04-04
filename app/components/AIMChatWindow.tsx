"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { iconPath } from "@/lib/icons";
import { FONT_AIM, FONT_SIZE_XP } from "@/lib/xp-fonts";
import { ChatBlock } from "./ChatBlock";
import { XPTitleBarButtons } from "./XPTitleBarButtons";

type AIMChatWindowProps = {
  screenName?: string;
  onMinimize: () => void;
  onClose?: () => void;
  hidden?: boolean;
  style?: React.CSSProperties;
  /** Z-index when this window is in front; parent controls based on last click. */
  zIndex?: number;
  /** Call when the window is clicked so parent can bring it to front. */
  onBringToFront?: () => void;
  /** Key to reset chat when changed */
  chatKey?: number;
  /** Call when user clicks a project link in chat; opens that project in Notepad. */
  onOpenProject?: (slug: string) => void;
  /** Project list (title, slug) so chat can resolve root-URL links to project slugs. */
  projects?: Array<{ title: string; slug: string }>;
};

const WINDOW_WIDTH = 420;
const WINDOW_HEIGHT = 420;

const TASKBAR_HEIGHT = 36;
/** Viewports narrower than this use a fitted width/height so the window stays on screen (mobile). */
const MOBILE_BREAKPOINT_PX = 640;
const MOBILE_PAD_X = 8;
const MOBILE_PAD_Y = 8;

function restoredWindowSize(viewportW: number, viewportH: number) {
  const compact = viewportW < MOBILE_BREAKPOINT_PX;
  const w = compact ? Math.max(260, viewportW - MOBILE_PAD_X * 2) : WINDOW_WIDTH;
  const h = compact
    ? Math.max(320, Math.min(580, viewportH - TASKBAR_HEIGHT - MOBILE_PAD_Y * 2))
    : WINDOW_HEIGHT;
  return { compact, w, h };
}

export function AIMChatWindow({ screenName = "website_visitor_1", onMinimize, onClose, hidden = false, style, zIndex = 50, onBringToFront, chatKey, onOpenProject, projects }: AIMChatWindowProps) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [viewport, setViewport] = useState({ w: 800, h: 600 });
  const [mounted, setMounted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [restoreRect, setRestoreRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [useAimIconFallback, setUseAimIconFallback] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, left: 0, top: 0 });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const iw = window.innerWidth;
    const ih = window.innerHeight;
    setViewport({ w: iw, h: ih });
    const { w: rw, h: rh } = restoredWindowSize(iw, ih);
    setPos({
      x: Math.max(MOBILE_PAD_X, (iw - rw) / 2),
      y: Math.max(MOBILE_PAD_Y, (ih - rh - TASKBAR_HEIGHT - 12) / 2),
    });
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || typeof window === "undefined") return;
    const onResize = () => {
      const iw = window.innerWidth;
      const ih = window.innerHeight;
      setViewport({ w: iw, h: ih });
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [mounted]);

  /** After rotate/resize, keep the restored (non-maximized) window inside the viewport. */
  useEffect(() => {
    if (!mounted || isMaximized) return;
    const { w: rw, h: rh } = restoredWindowSize(viewport.w, viewport.h);
    setPos((p) => ({
      x: Math.max(MOBILE_PAD_X, Math.min(p.x, viewport.w - rw - MOBILE_PAD_X)),
      y: Math.max(MOBILE_PAD_Y, Math.min(p.y, viewport.h - rh - TASKBAR_HEIGHT - MOBILE_PAD_Y)),
    }));
  }, [viewport.w, viewport.h, mounted, isMaximized]);

  const toggleMaximize = useCallback(() => {
    if (isMaximized && restoreRect) {
      setPos({ x: restoreRect.x, y: restoreRect.y });
      setRestoreRect(null);
      setIsMaximized(false);
    } else {
      const { w, h } = restoredWindowSize(viewport.w, viewport.h);
      setRestoreRect({ x: pos.x, y: pos.y, width: w, height: h });
      setPos({ x: 0, y: 0 });
      setIsMaximized(true);
    }
  }, [isMaximized, restoreRect, pos.x, pos.y, viewport.w, viewport.h]);

  const handleTitleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest("button") || isMaximized) return;
      setIsDragging(true);
      dragStart.current = { x: e.clientX, y: e.clientY, left: pos.x, top: pos.y };
    },
    [pos.x, pos.y, isMaximized]
  );

  useEffect(() => {
    if (!isDragging || isMaximized) return;
    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      const iw = typeof window !== "undefined" ? window.innerWidth : 800;
      const ih = typeof window !== "undefined" ? window.innerHeight : 600;
      const { w: winW, h: winH } = restoredWindowSize(iw, ih);
      setPos({
        x: Math.max(MOBILE_PAD_X, Math.min(iw - winW - MOBILE_PAD_X, dragStart.current.left + dx)),
        y: Math.max(MOBILE_PAD_Y, Math.min(ih - winH - TASKBAR_HEIGHT - MOBILE_PAD_Y, dragStart.current.top + dy)),
      });
    };
    const handleMouseUp = () => setIsDragging(false);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, isMaximized]);

  if (!mounted) return null;

  const { w: restoredW, h: restoredH, compact: isCompactLayout } = restoredWindowSize(viewport.w, viewport.h);
  const effectiveWidth = isMaximized ? viewport.w : restoredW;
  const effectiveHeight = isMaximized ? viewport.h - TASKBAR_HEIGHT : restoredH;

  const containerStyle: React.CSSProperties = {
    position: "fixed",
    left: isMaximized ? 0 : pos.x,
    top: isMaximized ? 0 : pos.y,
    width: effectiveWidth,
    height: effectiveHeight,
    maxWidth: isCompactLayout || isMaximized ? "100vw" : undefined,
    boxSizing: "border-box",
    minWidth: isMaximized || isCompactLayout ? 0 : WINDOW_WIDTH,
    minHeight: isMaximized || isCompactLayout ? 0 : WINDOW_HEIGHT,
    display: hidden ? "none" : "flex",
    flexDirection: "column",
    fontFamily: FONT_AIM,
    borderRadius: isMaximized ? 0 : "8px 8px 0 0",
    boxShadow: "2px 2px 0 #0054e3, 2px 2px 8px rgba(0,0,0,0.25)",
    border: "2px solid #0054e3",
    overflow: "hidden",
    zIndex,
    cursor: isLoading ? "url('/cursors/cursor-loading.png') 0 0, url('/cursors/cursor.png') 0 0, wait" : undefined,
    ...style,
  };

  return (
    <div
      style={containerStyle}
      className={`aim-window ${isLoading ? "cursor-loading" : ""}`}
      onMouseDown={onBringToFront}
      role="dialog"
      data-loading={isLoading}
    >
      {/* Title bar - draggable (unless maximized) */}
      <div
        role="presentation"
        onMouseDown={handleTitleMouseDown}
        className="flex items-center justify-between px-2 select-none flex-shrink-0 text-white text-sm"
        style={{
          height: 26,
          paddingTop: 2,
          paddingBottom: 2,
          paddingRight: 8,
          background: "linear-gradient(180deg, #0054e3 0%, #0047d0 50%, #003cba 100%)",
          borderBottom: "1px solid #003cda",
          cursor: isMaximized ? "default" : "move",
        }}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {useAimIconFallback ? (
            <div className="w-4 h-4 flex-shrink-0 bg-yellow-400 rounded-sm flex items-center justify-center text-[10px] font-bold text-black">
              A
            </div>
          ) : (
            <img
              src={iconPath("aim")}
              alt=""
              className="w-4 h-4 flex-shrink-0 object-contain"
              width={16}
              height={16}
              onError={() => setUseAimIconFallback(true)}
            />
          )}
          <span className="truncate">AiOL Instant Message: L-997 - Instant Message</span>
        </div>
        <XPTitleBarButtons
          onMinimize={onMinimize}
          onMaximize={toggleMaximize}
          onClose={onClose}
          isMaximized={isMaximized}
        />
      </div>

      {/* Menu bar */}
      <div
        className="flex items-center gap-4 px-3 h-[22px] flex-shrink-0 text-sm bg-[#ece9d8] border-b border-[#ccc]"
        style={{ fontFamily: "Tahoma, Verdana, sans-serif" }}
      >
        <span className="cursor-pointer hover:underline">File</span>
        <span className="cursor-pointer hover:underline">Edit</span>
        <span className="cursor-pointer hover:underline">Insert</span>
        <span className="cursor-pointer hover:underline">People</span>
        <span className="ml-auto hidden min-[640px]:inline text-xs text-neutral-600">L-997&apos;s Warning Level: 0%</span>
      </div>

      {/* Message area → formatting toolbar → input (ChatBlock); bottom bar has Send */}
      {/* relative + absolute inset-0: gives ChatBlock a definite height (flex % height is flaky). Beige fills any sub-pixel gap so Bliss doesn't show through. */}
      <div className="relative min-h-0 flex-1 overflow-hidden bg-white">
        <div className="absolute inset-0 flex min-h-0 flex-col overflow-hidden">
          <ChatBlock
            key={chatKey}
            embedded
            embeddedLayout="aim"
            aimUserLabel={screenName}
            aimAssistantLabel="L-997"
            onBusyChange={setIsLoading}
            onOpenProject={onOpenProject}
            projects={projects}
          />
        </div>
      </div>

      {/* Bottom button bar: scrollable faux-AIM actions + fixed Send (mobile: avoids clipping) */}
      <div className="flex min-w-0 items-center gap-2 px-2 py-1.5 flex-shrink-0 bg-[#ece9d8] border-t border-[#ccc]">
        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto overflow-y-hidden [scrollbar-width:thin]">
          <button type="button" className="flex-shrink-0 px-2 py-1 text-xs border border-[#999] rounded bg-[#e0e0e0] hover:bg-[#d0d0d0]" title="Warn">Warn</button>
          <button type="button" className="flex-shrink-0 px-2 py-1 text-xs border border-[#999] rounded bg-[#e0e0e0] hover:bg-[#d0d0d0]" title="Block">Block</button>
          <button type="button" className="flex-shrink-0 px-2 py-1 text-xs border border-[#999] rounded bg-[#e0e0e0] hover:bg-[#d0d0d0]" title="Add Buddy">Add Buddy</button>
          <button type="button" className="flex-shrink-0 px-2 py-1 text-xs border border-[#999] rounded bg-[#e0e0e0] hover:bg-[#d0d0d0]" title="Talk">Talk</button>
          <button type="button" className="flex-shrink-0 px-2 py-1 text-xs border border-[#999] rounded bg-[#e0e0e0] hover:bg-[#d0d0d0]" title="Get Info">Get Info</button>
        </div>
        <div className="flex flex-shrink-0 items-center gap-1">
          <div
            className="w-2 h-6 rounded-sm flex-shrink-0"
            style={{ background: "linear-gradient(180deg, #22c55e 0%, #eab308 50%, #ef4444 100%)" }}
            title="Send status"
            aria-hidden
          />
          <button
            type="submit"
            form="aim-chat-form"
            className="flex items-center gap-1 px-2 py-1 text-xs border border-[#666] rounded bg-[#e0e0e0] hover:bg-[#d0d0d0] font-medium"
            title="Send"
          >
            <span aria-hidden>✈</span> Send
          </button>
        </div>
      </div>
    </div>
  );
}
