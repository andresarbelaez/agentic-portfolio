"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { iconPath } from "@/lib/icons";
import { FONT_XP_UI, FONT_SIZE_XP } from "@/lib/xp-fonts";
import { XPTitleBarButtons } from "./XPTitleBarButtons";

const TASKBAR_HEIGHT = 36;

/** AIM running-man logo: yellow stick figure mid-stride (XP-era style) */
function RunningManIcon({
  size = 24,
  className,
  fill = "#FFCC00",
}: {
  size?: number;
  className?: string;
  fill?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 32"
      width={size}
      height={size}
      className={className}
      style={{ display: "block" }}
    >
      {/* head */}
      <circle cx="12" cy="6" r="4.5" fill={fill} stroke="#000" strokeWidth="0.8" />
      {/* body */}
      <line x1="12" y1="10.5" x2="12" y2="20" stroke="#000" strokeWidth="1.2" />
      {/* arm back */}
      <line x1="12" y1="14" x2="6" y2="12" stroke="#000" strokeWidth="1.2" />
      {/* arm front */}
      <line x1="12" y1="14" x2="18" y2="16" stroke="#000" strokeWidth="1.2" />
      {/* leg back (extended) */}
      <line x1="12" y1="20" x2="8" y2="28" stroke="#000" strokeWidth="1.2" />
      {/* leg front (bent forward) */}
      <line x1="12" y1="20" x2="16" y2="28" stroke="#000" strokeWidth="1.2" />
    </svg>
  );
}

/** Red key icon next to ScreenName label (XP-style) */
function KeyIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 14 12" width={14} height={12} className={className} style={{ display: "inline-block", verticalAlign: "middle", marginRight: 4 }}>
      <circle cx="5" cy="5" r="4" fill="#c00" stroke="#800" strokeWidth="0.6" />
      <rect x="7" y="3" width="6" height="2.5" rx="0.5" fill="#c00" stroke="#800" strokeWidth="0.5" />
      <rect x="10" y="1.5" width="1.2" height="2" fill="#c00" />
      <rect x="11.5" y="2.8" width="1.2" height="2" fill="#c00" />
    </svg>
  );
}

/** Question mark (Help) - yellow/blue stacked style */
function HelpIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={24} height={24} className={className}>
      <circle cx="12" cy="12" r="11" fill="#F5E642" stroke="#666" strokeWidth="1" />
      <path fill="#0054E3" d="M12 6a4 4 0 0 0-4 4h2a2 2 0 1 1 2 2c0 1-.5 1.5-1 2v1h2v-1.2c1-.6 1.5-1.2 1.5-2.3A4 4 0 0 0 12 6z" />
      <circle cx="12" cy="17" r="1.5" fill="#0054E3" />
    </svg>
  );
}

/** Wrench (Setup) */
function WrenchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={24} height={24} className={className}>
      <path fill="#E6B422" stroke="#666" strokeWidth="0.8" d="M21.5 19.2l-5.2-5.2a7 7 0 0 0-1-9.5 7 7 0 0 0-9.9 9.9 7 7 0 0 0 9.5 1l5.2 5.2a1.2 1.2 0 0 0 1.7 0l1.4-1.4a1.2 1.2 0 0 0 0-1.7zM6 6a4 4 0 0 1 5.7 0 4 4 0 0 1 0 5.6L5 14.3 2 17l2.8-2.8 2.6-2.7a4 4 0 0 1 0-5.6 4 4 0 0 1-2.4-1.2z" />
    </svg>
  );
}

type SignOnStep = "form" | "connecting" | "verifying" | "starting";

const XP_TITLE_GRADIENT = "linear-gradient(180deg, #0054e3 0%, #0047d0 50%, #003cba 100%)";
const XP_BLUE_PANEL = "#3366aa";
const XP_GRAY_PANEL = "#ece9d8";
const XP_BORDER = "#ccc";

type AIMSignOnWindowProps = {
  onSignOnSuccess: (screenName: string) => void;
  onClose?: () => void;
};

const SIGNON_WIDTH = 320;
const SIGNON_HEIGHT = 420;

export function AIMSignOnWindow({ onSignOnSuccess, onClose }: AIMSignOnWindowProps) {
  const [screenName, setScreenName] = useState("Wolf");
  const [password, setPassword] = useState("XXXX");
  const [step, setStep] = useState<SignOnStep>("form");
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [restoreRect, setRestoreRect] = useState<{ x: number; y: number } | null>(null);
  const [useAimFallback, setUseAimFallback] = useState(false);
  const [useHelpFallback, setUseHelpFallback] = useState(false);
  const [useSetupFallback, setUseSetupFallback] = useState(false);
  const [useKeyFallback, setUseKeyFallback] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, left: 0, top: 0 });
  const progressTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setPos({
      x: Math.max(0, (window.innerWidth - SIGNON_WIDTH) / 2),
      y: Math.max(0, (window.innerHeight - SIGNON_HEIGHT - 80) / 2),
    });
    setMounted(true);
  }, []);

  // Run connecting → verifying → starting → success. Don't clear these timeouts when step advances.
  useEffect(() => {
    if (step !== "connecting") return;
    const name = screenName.trim() || "Wolf";
    const t1 = setTimeout(() => setStep("verifying"), 800);
    const t2 = setTimeout(() => setStep("starting"), 1600);
    const t3 = setTimeout(() => onSignOnSuccess(name), 2600);
    progressTimeoutsRef.current = [t1, t2, t3];
    return () => {}; // do not clear here — cleanup runs when step changes and would cancel t2/t3
  }, [step, onSignOnSuccess, screenName]);

  // Clear progress timeouts only on unmount (or cancel handles its own clearing)
  useEffect(() => {
    return () => {
      progressTimeoutsRef.current.forEach(clearTimeout);
      progressTimeoutsRef.current = [];
    };
  }, []);

  const toggleMaximize = useCallback(() => {
    if (isMaximized && restoreRect) {
      setPos({ x: restoreRect.x, y: restoreRect.y });
      setRestoreRect(null);
      setIsMaximized(false);
    } else {
      setRestoreRect({ x: pos.x, y: pos.y });
      setPos({ x: 0, y: 0 });
      setIsMaximized(true);
    }
  }, [isMaximized, restoreRect, pos.x, pos.y]);

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
    const onMove = (e: MouseEvent) => {
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      const w = typeof window !== "undefined" ? window.innerWidth : 800;
      const h = typeof window !== "undefined" ? window.innerHeight : 600;
      setPos({
        x: Math.max(0, Math.min(w - SIGNON_WIDTH, dragStart.current.left + dx)),
        y: Math.max(0, Math.min(h - 120, dragStart.current.top + dy)),
      });
    };
    const onUp = () => setIsDragging(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [isDragging, isMaximized]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step !== "form") return;
    setStep("connecting");
  };

  const cancelProgress = () => {
    progressTimeoutsRef.current.forEach(clearTimeout);
    progressTimeoutsRef.current = [];
    setStep("form");
  };

  if (!mounted) return null;

  const isProgress = step !== "form";

  return (
    <div
      role="dialog"
      aria-label="AiOL Sign On"
      style={{
        position: "fixed",
        left: isMaximized ? 0 : pos.x,
        top: isMaximized ? 0 : pos.y,
        width: isMaximized ? (typeof window !== "undefined" ? window.innerWidth : 800) : SIGNON_WIDTH,
        minHeight: isMaximized ? (typeof window !== "undefined" ? window.innerHeight - TASKBAR_HEIGHT : 564) : (isProgress ? 280 : SIGNON_HEIGHT),
        fontFamily: FONT_XP_UI,
        borderRadius: isMaximized ? 0 : "8px 8px 0 0",
        boxShadow: "2px 2px 0 #0054e3, 2px 2px 12px rgba(0,0,0,0.25)",
        border: "2px solid #0054e3",
        overflow: "hidden",
        zIndex: 60,
        display: "flex",
        flexDirection: "column",
        background: XP_GRAY_PANEL,
      }}
      className="aim-signon-window"
    >
      {/* Title bar */}
      <div
        onMouseDown={handleTitleMouseDown}
        style={{
          height: 26,
          paddingTop: 2,
          paddingBottom: 2,
          background: XP_TITLE_GRADIENT,
          borderBottom: "1px solid #003cda",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingLeft: 8,
          paddingRight: 8,
          cursor: isMaximized ? "default" : "move",
          flexShrink: 0,
          fontFamily: FONT_XP_UI,
        }}
        className="select-none"
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
          {useAimFallback ? (
            <RunningManIcon size={16} fill="#FFCC00" />
          ) : (
            <img src={iconPath("aim")} alt="" width={16} height={16} onError={() => setUseAimFallback(true)} style={{ display: "block" }} />
          )}
          <span style={{ color: "#fff", fontSize: FONT_SIZE_XP.title, fontWeight: 600, fontFamily: FONT_XP_UI }}>Sign On</span>
        </div>
        <XPTitleBarButtons onMaximize={toggleMaximize} onClose={onClose} isMaximized={isMaximized} />
      </div>

      {/* Blue branding panel */}
      <div
        style={{
          background: XP_BLUE_PANEL,
          padding: "16px 12px 12px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        {useAimFallback ? (
          <RunningManIcon size={56} fill="#FFCC00" />
        ) : (
          <img src={iconPath("aim")} alt="" width={56} height={56} onError={() => setUseAimFallback(true)} style={{ display: "block" }} />
        )}
        <div style={{ color: "#fff", marginTop: 6, textAlign: "center" }}>
          <span style={{ fontSize: FONT_SIZE_XP.standard, fontFamily: FONT_XP_UI }}>AiOL</span>
          <br />
          <span style={{ fontSize: FONT_SIZE_XP.title, fontWeight: "bold", fontFamily: FONT_XP_UI }}>Instant Messenger</span>
        </div>
      </div>

      {/* Content: form or progress */}
      <div
        style={{
          flex: 1,
          background: XP_GRAY_PANEL,
          borderTop: `1px solid ${XP_BORDER}`,
          padding: "14px 12px 12px",
          minHeight: isProgress ? 120 : 200,
          fontFamily: FONT_XP_UI,
        }}
      >
        {step === "form" && (
          <form id="aim-signon-form" onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <label style={{ fontSize: FONT_SIZE_XP.standard, fontWeight: 600, display: "flex", alignItems: "center", fontFamily: FONT_XP_UI }}>
              {useKeyFallback ? <KeyIcon /> : <img src={iconPath("key")} alt="" width={14} height={12} onError={() => setUseKeyFallback(true)} style={{ display: "inline-block", verticalAlign: "middle", marginRight: 4 }} />}
              ScreenName
            </label>
            <input
              type="text"
              value={screenName}
              onChange={(e) => setScreenName(e.target.value)}
              placeholder="ScreenName"
              style={inputStyle}
              autoComplete="username"
            />
            <a href="#" onClick={(e) => e.preventDefault()} style={{ fontSize: FONT_SIZE_XP.standard, color: "#0054e3", textDecoration: "underline", fontFamily: FONT_XP_UI }}>
              Get a Screen Name
            </a>

            <label style={{ fontSize: FONT_SIZE_XP.standard, fontWeight: 600, marginTop: 4, fontFamily: FONT_XP_UI }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              style={inputStyle}
              autoComplete="current-password"
            />
            <a href="#" onClick={(e) => e.preventDefault()} style={{ fontSize: FONT_SIZE_XP.standard, color: "#0054e3", textDecoration: "underline", fontFamily: FONT_XP_UI }}>
              Forgot Password?
            </a>

            <div style={{ display: "flex", gap: 16, marginTop: 6 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: FONT_SIZE_XP.standard, cursor: "pointer", fontFamily: FONT_XP_UI }}>
                <input type="checkbox" style={{ width: 12, height: 12 }} />
                Save password
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: FONT_SIZE_XP.standard, cursor: "pointer", fontFamily: FONT_XP_UI }}>
                <input type="checkbox" style={{ width: 12, height: 12 }} />
                Auto-login
              </label>
            </div>
          </form>
        )}

        {(step === "connecting" || step === "verifying" || step === "starting") && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, paddingTop: 8 }}>
            <div style={{ fontWeight: 600, fontSize: FONT_SIZE_XP.title, fontFamily: FONT_XP_UI }}>{screenName.trim() || "Wolf"}</div>
            <div style={{ fontSize: FONT_SIZE_XP.standard, fontFamily: FONT_XP_UI }}>
              {step === "connecting" && "1. Connecting..."}
              {step === "verifying" && "2. Verifying name and password..."}
              {step === "starting" && "3. Starting services..."}
            </div>
            <button type="button" onClick={cancelProgress} style={btnCancel}>
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Footer: Help, Setup, Version | Sign On */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          padding: "8px 10px 10px",
          borderTop: `1px solid ${XP_BORDER}`,
          background: XP_GRAY_PANEL,
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          <div style={{ display: "flex", gap: 16 }}>
            <button type="button" style={btnFooter} title="Help">
              {useHelpFallback ? <HelpIcon /> : <img src={iconPath("help")} alt="" width={24} height={24} onError={() => setUseHelpFallback(true)} />}
              <span style={{ fontSize: FONT_SIZE_XP.small, textDecoration: "underline", fontFamily: FONT_XP_UI }}>Help</span>
            </button>
            <button type="button" style={btnFooter} title="Setup">
              {useSetupFallback ? <WrenchIcon /> : <img src={iconPath("setup")} alt="" width={24} height={24} onError={() => setUseSetupFallback(true)} />}
              <span style={{ fontSize: FONT_SIZE_XP.small, textDecoration: "underline", fontFamily: FONT_XP_UI }}>Setup</span>
            </button>
          </div>
          <span style={{ fontSize: FONT_SIZE_XP.small, color: "#666", fontFamily: FONT_XP_UI }}>Version: 5.9.3857</span>
        </div>
        {step === "form" && (
          <button type="submit" form="aim-signon-form" style={btnSignOn}>
            {useAimFallback ? (
              <RunningManIcon size={28} fill="#22aa22" />
            ) : (
              <img src={iconPath("aim")} alt="" width={28} height={28} onError={() => setUseAimFallback(true)} style={{ display: "block" }} />
            )}
            <span style={{ fontSize: FONT_SIZE_XP.standard, textDecoration: "underline", fontFamily: FONT_XP_UI }}>Sign On</span>
          </button>
        )}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "4px 6px",
  fontSize: FONT_SIZE_XP.standard,
  border: "1px solid #888",
  borderRadius: 2,
  background: "#fff",
  boxSizing: "border-box",
  fontFamily: FONT_XP_UI,
};
const btnCancel: React.CSSProperties = {
  marginTop: 4,
  padding: "4px 16px",
  fontSize: FONT_SIZE_XP.standard,
  border: "1px solid #888",
  borderRadius: 2,
  background: "linear-gradient(180deg, #f0f0f0 0%, #e0e0e0 100%)",
  cursor: "pointer",
  fontFamily: FONT_XP_UI,
};
const btnFooter: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 2,
  background: "none",
  border: "none",
  cursor: "pointer",
  padding: 2,
};
const btnSignOn: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 2,
  padding: "6px 12px",
  border: "1px solid #2a7a2a",
  borderRadius: 4,
  background: "linear-gradient(180deg, #44cc44 0%, #22aa22 50%, #1a881a 100%)",
  cursor: "pointer",
  color: "#fff",
  fontFamily: FONT_XP_UI,
  boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
};
