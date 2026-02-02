"use client";

/**
 * Windows XP–style title bar buttons (minimize, maximize/restore, close).
 * Matches reference: square, light silver/gray for min/max, red (more saturated on hover) for close.
 */
const BTN_SIZE = 21;
const BTN_SILVER = "#c8c8c8";
const BTN_SILVER_HOVER = "#d8d8d8";
const BTN_ICON = "#2b2b2b";
const BTN_CLOSE = "#c0392b";
const BTN_CLOSE_HOVER = "#e74c3c";

const btnBase: React.CSSProperties = {
  width: BTN_SIZE,
  height: BTN_SIZE,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: "none",
  cursor: "pointer",
  padding: 0,
  flexShrink: 0,
  background: BTN_SILVER,
  color: BTN_ICON,
};

type XPTitleBarButtonsProps = {
  onMinimize?: () => void;
  onMaximize?: () => void;
  onClose?: () => void;
  isMaximized?: boolean;
};

export function XPTitleBarButtons({ onMinimize, onMaximize, onClose, isMaximized = false }: XPTitleBarButtonsProps) {
  return (
    <div style={{ display: "flex", flexShrink: 0 }}>
      <button
        type="button"
        aria-label="Minimize"
        onClick={onMinimize}
        style={btnBase}
        className="xp-title-btn-min"
      >
        <svg width={10} height={2} viewBox="0 0 10 2" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
          <line x1="0" y1="1" x2="10" y2="1" />
        </svg>
      </button>
      <button
        type="button"
        aria-label={isMaximized ? "Restore" : "Maximize"}
        onClick={onMaximize}
        style={btnBase}
        className="xp-title-btn-max"
      >
        {isMaximized ? (
          <svg width={12} height={12} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2">
            <rect x="1" y="4" width="7" height="7" />
            <rect x="4" y="1" width="7" height="7" />
          </svg>
        ) : (
          <svg width={10} height={10} viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.2">
            <rect x="0" y="0" width="10" height="10" />
          </svg>
        )}
      </button>
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        style={{
          ...btnBase,
          background: BTN_CLOSE,
          color: "#fff",
        }}
        className="xp-title-btn-close"
      >
        <svg width={10} height={10} viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
          <line x1="1" y1="1" x2="9" y2="9" />
          <line x1="9" y1="1" x2="1" y2="9" />
        </svg>
      </button>
    </div>
  );
}
