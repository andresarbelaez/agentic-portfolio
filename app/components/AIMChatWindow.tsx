"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { iconPath } from "@/lib/icons";
import { FONT_AIM, FONT_SIZE_XP } from "@/lib/xp-fonts";
import { ChatBlock } from "./ChatBlock";

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

export function AIMChatWindow({ screenName = "website_visitor_1", onMinimize, onClose, hidden = false, style, zIndex = 50, onBringToFront, chatKey, onOpenProject, projects }: AIMChatWindowProps) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [useAimIconFallback, setUseAimIconFallback] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, left: 0, top: 0 });

  useEffect(() => {
    if (typeof window === "undefined") return;
    setPos({
      x: Math.max(0, (window.innerWidth - WINDOW_WIDTH) / 2),
      y: Math.max(0, (window.innerHeight - WINDOW_HEIGHT - 80) / 2),
    });
    setMounted(true);
  }, []);

  const handleTitleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest("button")) return;
      setIsDragging(true);
      dragStart.current = { x: e.clientX, y: e.clientY, left: pos.x, top: pos.y };
    },
    [pos.x, pos.y]
  );

  useEffect(() => {
    if (!isDragging) return;
    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      const w = typeof window !== "undefined" ? window.innerWidth : 800;
      const h = typeof window !== "undefined" ? window.innerHeight : 600;
      setPos({
        x: Math.max(0, Math.min(w - WINDOW_WIDTH, dragStart.current.left + dx)),
        y: Math.max(0, Math.min(h - 150, dragStart.current.top + dy)),
      });
    };
    const handleMouseUp = () => setIsDragging(false);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  if (!mounted) return null;

  const containerStyle: React.CSSProperties = {
    position: "fixed",
    left: pos.x,
    top: pos.y,
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    minWidth: WINDOW_WIDTH,
    minHeight: WINDOW_HEIGHT,
    display: hidden ? "none" : "flex",
    flexDirection: "column",
    fontFamily: FONT_AIM,
    borderRadius: "8px 8px 0 0",
    boxShadow: "2px 2px 8px rgba(0,0,0,0.3)",
    border: "1px solid #003cda",
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
      {/* Title bar - draggable */}
      <div
        role="presentation"
        onMouseDown={handleTitleMouseDown}
        className="flex items-center justify-between px-2 h-7 cursor-move select-none flex-shrink-0 text-white text-sm"
        style={{
          background: "linear-gradient(180deg, #0054e3 0%, #0047d0 50%, #003cba 100%)",
          borderBottom: "1px solid #003cda",
        }}
      >
        <div className="flex items-center gap-2 min-w-0">
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
          <span className="truncate">AOL Instant Message: L-997 - Instant Message</span>
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
          <button type="button" aria-label="Maximize" className="w-6 h-5 flex items-center justify-center text-white hover:bg-white/20 border border-transparent rounded-sm">
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
        className="flex items-center gap-4 px-3 h-[22px] flex-shrink-0 text-sm bg-[#ece9d8] border-b border-[#ccc]"
        style={{ fontFamily: "Tahoma, Verdana, sans-serif" }}
      >
        <span className="cursor-pointer hover:underline">File</span>
        <span className="cursor-pointer hover:underline">Edit</span>
        <span className="cursor-pointer hover:underline">Insert</span>
        <span className="cursor-pointer hover:underline">People</span>
        <span className="ml-auto text-xs text-neutral-600">L-997&apos;s Warning Level: 0%</span>
      </div>

      {/* Message area → formatting toolbar → input (ChatBlock); bottom bar has Send */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
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

      {/* Bottom button bar: Warn, Block, Add Buddy, Talk, Get Info, [status strip], Send */}
      <div className="flex items-center justify-between gap-2 px-2 py-1.5 flex-shrink-0 bg-[#ece9d8] border-t border-[#ccc]">
        <div className="flex items-center gap-1">
          <button type="button" className="px-2 py-1 text-xs border border-[#999] rounded bg-[#e0e0e0] hover:bg-[#d0d0d0]" title="Warn">Warn</button>
          <button type="button" className="px-2 py-1 text-xs border border-[#999] rounded bg-[#e0e0e0] hover:bg-[#d0d0d0]" title="Block">Block</button>
          <button type="button" className="px-2 py-1 text-xs border border-[#999] rounded bg-[#e0e0e0] hover:bg-[#d0d0d0]" title="Add Buddy">Add Buddy</button>
          <button type="button" className="px-2 py-1 text-xs border border-[#999] rounded bg-[#e0e0e0] hover:bg-[#d0d0d0]" title="Talk">Talk</button>
          <button type="button" className="px-2 py-1 text-xs border border-[#999] rounded bg-[#e0e0e0] hover:bg-[#d0d0d0]" title="Get Info">Get Info</button>
        </div>
        <div className="flex items-center gap-1">
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
