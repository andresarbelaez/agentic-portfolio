"use client";

import React, { useState, useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import ReactMarkdown from "react-markdown";
import { FONT_AIM } from "@/lib/xp-fonts";

function messageText(m: { content?: unknown; parts?: Array<{ type?: string; text?: string }> }): string {
  const c = (m as { content?: unknown }).content;
  if (typeof c === "string") return c;
  const parts = (m as { parts?: Array<{ type?: string; text?: string }> }).parts ?? (Array.isArray(c) ? c : []);
  const out = parts.map((p) => (p.type === "text" ? p.text ?? "" : "")).join("");
  return out || String(c ?? "");
}

/** Default message from the agent at the start of every AIM chat */
const AIM_DEFAULT_MESSAGE =
  "Hello! I'm L-997, your guide to Andres' portfolio. Andres Arbelaez is a design technologist who has shipped design and code at companies like Meta and IDEO. What area of his portfolio would you like to explore?";

const PROJECT_LINK_PREFIX = "project:";

type ChatBlockProps = {
  embedded?: boolean;
  embeddedLayout?: "default" | "aim";
  /** For AIM layout: label before user messages (e.g. screen name) */
  aimUserLabel?: string;
  /** For AIM layout: label before assistant messages */
  aimAssistantLabel?: string;
  /** Callback when busy state changes (for loading cursor) */
  onBusyChange?: (busy: boolean) => void;
  /** When user clicks a project link in chat (format [title](project:slug)), open that project in Notepad */
  onOpenProject?: (slug: string) => void;
  /** Project list so we can resolve root-URL links by title and support project:slug links */
  projects?: Array<{ title: string; slug: string }>;
};

export function ChatBlock({
  embedded,
  embeddedLayout = "default",
  aimUserLabel = "You",
  aimAssistantLabel = "L-997",
  onBusyChange,
  onOpenProject,
  projects = [],
}: ChatBlockProps = {}) {
  const isProjectSlugLink = (href: string | undefined) => typeof href === "string" && href.startsWith(PROJECT_LINK_PREFIX);
  const getSlugFromHref = (href: string) => href.slice(PROJECT_LINK_PREFIX.length);

  const isSiteRootUrl = (href: string | undefined) => {
    if (typeof href !== "string") return false;
    try {
      const u = new URL(href);
      const h = u.hostname.replace(/^www\./, "");
      return (h === "andresma.com" && (!u.pathname || u.pathname === "/"));
    } catch {
      return false;
    }
  };

  const getLinkText = (node: React.ReactNode): string => {
    if (node == null) return "";
    if (typeof node === "string") return node;
    if (Array.isArray(node)) return node.map(getLinkText).join("");
    if (React.isValidElement(node) && node.props?.children != null) return getLinkText(node.props.children);
    return "";
  };

  const linkComponent = {
    a: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
      if (onOpenProject && isProjectSlugLink(href)) {
        return (
          <a
            href="#"
            role="button"
            className="text-[#0054e3] underline cursor-pointer hover:text-[#003cba]"
            onClick={(e) => {
              e.preventDefault();
              onOpenProject(getSlugFromHref(href!));
            }}
            {...props}
          >
            {children}
          </a>
        );
      }
      if (onOpenProject && projects.length > 0 && isSiteRootUrl(href)) {
        const text = getLinkText(children);
        const project = projects.find((p) => p.title === text || p.title.trim() === text);
        if (project) {
          return (
            <a
              href="#"
              role="button"
              className="text-[#0054e3] underline cursor-pointer hover:text-[#003cba]"
              onClick={(e) => {
                e.preventDefault();
                onOpenProject(project.slug);
              }}
              {...props}
            >
              {children}
            </a>
          );
        }
      }
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" className="text-[#0054e3] underline hover:text-[#003cba]" {...props}>
          {children}
        </a>
      );
    },
  };
  const [input, setInput] = useState("");
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });
  const busy = status === "streaming" || status === "submitted";
  const isAimLayout = embedded && embeddedLayout === "aim";
  // Show prefix after 0.5s, then type out the message
  const [showPrefix, setShowPrefix] = useState(false);
  const [typedText, setTypedText] = useState("");

  // Reset typing state when chat is reset (component remounts)
  useEffect(() => {
    if (isAimLayout && messages.length === 0) {
      setShowPrefix(false);
      setTypedText("");
      // Show prefix after 0.5s
      const prefixTimer = setTimeout(() => {
        setShowPrefix(true);
      }, 500);
      return () => clearTimeout(prefixTimer);
    } else if (messages.length > 0) {
      // Once user sends a message, show default message immediately if not already shown
      setShowPrefix(true);
      setTypedText(AIM_DEFAULT_MESSAGE);
    }
  }, [isAimLayout, messages.length]);

  // Type out the message character by character after prefix appears
  useEffect(() => {
    if (!isAimLayout || !showPrefix || messages.length > 0 || typedText === AIM_DEFAULT_MESSAGE) {
      return;
    }

    const typingInterval = setInterval(() => {
      setTypedText((current) => {
        if (current.length < AIM_DEFAULT_MESSAGE.length) {
          return AIM_DEFAULT_MESSAGE.slice(0, current.length + 1);
        }
        return current;
      });
    }, 30); // ~33 characters per second for natural typing speed

    return () => clearInterval(typingInterval);
  }, [isAimLayout, showPrefix, messages.length, typedText]);

  useEffect(() => {
    onBusyChange?.(busy);
  }, [busy, onBusyChange]);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, status, typedText]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    sendMessage({ text });
    setInput("");
  }

  const messagesArea = (
    <div
      ref={scrollContainerRef}
      className={`flex flex-col gap-3 ${embedded ? "flex-1 overflow-y-auto min-h-0" : "max-h-80 overflow-y-auto"} ${isAimLayout ? "bg-white p-2 border-b border-[#ccc]" : ""}`}
    >
      {messages.length === 0 && !isAimLayout && (
        <p className="py-2 text-sm text-neutral-400">Send a message to start.</p>
      )}
      {isAimLayout && showPrefix && (
        <div className="flex w-full justify-start text-left" style={{ fontFamily: FONT_AIM }}>
          <div className="w-full text-sm">
            <span className="font-semibold text-blue-600">{aimAssistantLabel}: </span>
            <span className="whitespace-pre-wrap break-words text-black">{typedText}</span>
          </div>
        </div>
      )}
      {messages.map((m) => {
        const isUser = m.role === "user";
        const prefix = isUser ? aimUserLabel : aimAssistantLabel;
        const prefixColor = isUser ? "text-red-600" : "text-blue-600";

        if (isAimLayout) {
          return (
            <div key={m.id} className="flex w-full justify-start text-left" style={{ fontFamily: FONT_AIM }}>
              <div className="w-full text-sm">
                <span className={`font-semibold ${prefixColor}`}>{prefix}: </span>
                {isUser ? (
                  <span className="whitespace-pre-wrap break-words text-black">{messageText(m)}</span>
                ) : (
                  <span className="text-black [&>*:last-child]:mb-0 [&>*:first-child]:mt-0 [&>*:first-child]:inline">
                    <ReactMarkdown
                      components={{
                        ...linkComponent,
                        p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
                        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                        ul: ({ children }) => <ul className="list-disc pl-4 space-y-0.5 my-1">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal pl-4 space-y-0.5 my-1">{children}</ol>,
                        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                      }}
                    >
                      {messageText(m).trim()}
                    </ReactMarkdown>
                  </span>
                )}
              </div>
            </div>
          );
        }

        return (
          <div
            key={m.id}
            className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                isUser
                  ? "bg-neutral-900 text-white rounded-br-md"
                  : "bg-neutral-100 text-neutral-900 border border-neutral-200 rounded-bl-md"
              }`}
            >
              {isUser ? (
                <span className="whitespace-pre-wrap break-words">{messageText(m)}</span>
              ) : (
                <div className="[&>*:last-child]:mb-0">
                  <ReactMarkdown
                    components={{
                      ...linkComponent,
                      p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                      strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                      ul: ({ children }) => <ul className="list-disc pl-4 space-y-0.5 my-2">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal pl-4 space-y-0.5 my-2">{children}</ol>,
                      li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                    }}
                  >
                    {messageText(m)}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  const formEl = (
    <form
      id={isAimLayout ? "aim-chat-form" : undefined}
      onSubmit={handleSubmit}
      className={
        isAimLayout
          ? "flex gap-2 p-2 bg-[#ece9d8] border-b border-[#ccc]"
          : embedded
            ? "flex gap-2 p-2 border-t border-neutral-300"
            : "mt-4 flex gap-2"
      }
      style={isAimLayout ? { fontFamily: FONT_AIM } : undefined}
    >
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={isAimLayout ? "Type a message…" : "e.g. What's Andres' experience at Meta?"}
        className="flex-1 rounded border border-neutral-300 px-2 py-1.5 text-sm focus:border-[#0054e3] focus:outline-none bg-white cursor-text"
        style={isAimLayout ? { fontFamily: FONT_AIM } : undefined}
        disabled={busy}
      />
      {!isAimLayout && (
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="rounded bg-[#0054e3] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#0047d0] disabled:opacity-50 border border-[#1a5fd4]"
        >
          {busy ? "…" : "Send"}
        </button>
      )}
    </form>
  );

  if (embedded) {
    if (isAimLayout) {
      return (
        <div className="flex flex-col h-full min-h-0 flex-1">
          {messagesArea}
          {/* Formatting toolbar: A A B I U link image smiley */}
          <div className="flex items-center gap-0.5 px-2 py-1 bg-[#ece9d8] border-b border-[#ccc] flex-shrink-0" style={{ fontFamily: FONT_AIM }}>
            <button type="button" className="w-6 h-6 flex items-center justify-center text-xs border border-transparent hover:bg-[#d0d0d0] rounded" title="Decrease font size">A</button>
            <button type="button" className="w-6 h-6 flex items-center justify-center text-xs font-bold border border-transparent hover:bg-[#d0d0d0] rounded" title="Increase font size">A</button>
            <button type="button" className="w-6 h-6 flex items-center justify-center text-xs font-bold border border-transparent hover:bg-[#d0d0d0] rounded" title="Bold">B</button>
            <button type="button" className="w-6 h-6 flex items-center justify-center text-xs italic border border-transparent hover:bg-[#d0d0d0] rounded" title="Italic">I</button>
            <button type="button" className="w-6 h-6 flex items-center justify-center text-xs underline border border-transparent hover:bg-[#d0d0d0] rounded" title="Underline">U</button>
            <span className="w-px h-4 bg-[#999] mx-0.5" />
            <button type="button" className="w-6 h-6 flex items-center justify-center border border-transparent hover:bg-[#d0d0d0] rounded" title="Insert link">🔗</button>
            <button type="button" className="w-6 h-6 flex items-center justify-center border border-transparent hover:bg-[#d0d0d0] rounded" title="Insert image">🖼</button>
            <button type="button" className="w-6 h-6 flex items-center justify-center border border-transparent hover:bg-[#d0d0d0] rounded" title="Insert emoticon">☺</button>
          </div>
          {formEl}
        </div>
      );
    }
    return (
      <div className="flex flex-col h-full min-h-0">
        {messagesArea}
        {formEl}
      </div>
    );
  }

  return (
    <section className="mt-10 max-w-2xl rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-medium">Ask about Andrés</h2>
      <p className="mt-1 text-sm text-neutral-500">
        Ask about Andrés's experience, projects, or skills.
      </p>
      <div className="mt-4">{messagesArea}</div>
      {formEl}
    </section>
  );
}
