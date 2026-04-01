'use client';

import { useState } from "react";
import { cn } from "@/platform/utils";
import { teleState } from "@/platform/teleState";
import type { TeleConnectionState, TeleActiveMode } from "@/platform/teleState";
import { syncTeleState, disconnectTele } from "@/platform/teleConnect";

interface BottomNavProps {
  className?: string;
}

const SparklesIcon = ({ className }: { className?: string }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 1.5 L13.6 6.8 L19 8 L13.6 9.2 L12 14.5 L10.4 9.2 L5 8 L10.4 6.8 Z" />
    <path d="M5 15 L5.9 17.6 L8.5 18.5 L5.9 19.4 L5 22 L4.1 19.4 L1.5 18.5 L4.1 17.6 Z" opacity="0.7" />
    <path d="M19 12.5 L19.7 14.6 L21.8 15.3 L19.7 16 L19 18.1 L18.3 16 L16.2 15.3 L18.3 14.6 Z" opacity="0.5" />
  </svg>
);

const SoundwaveIcon = ({ className }: { className?: string }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <rect x="2"  y="9"  width="2.5" height="6"  rx="1.25" opacity="0.45" />
    <rect x="6"  y="6"  width="2.5" height="12" rx="1.25" opacity="0.65" />
    <rect x="10" y="3"  width="2.5" height="18" rx="1.25" />
    <rect x="14" y="6"  width="2.5" height="12" rx="1.25" opacity="0.65" />
    <rect x="18" y="9"  width="2.5" height="6"  rx="1.25" opacity="0.45" />
  </svg>
);

const ChatIcon = ({ className }: { className?: string }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20 2H4C2.9 2 2 2.9 2 4V18L6 14H20C21.1 14 22 13.1 22 12V4C22 2.9 21.1 2 20 2Z" opacity="0.8" />
  </svg>
);

const ACTIVE =
  "border border-[var(--accent-strong)] bg-[var(--surface-bottom-nav-capsule)] shadow-[0px_0px_8px_0px_var(--accent-strong)] text-[var(--accent-strong)]";
const INACTIVE = "text-[var(--text-bottom-nav-icon-muted)]";

export function BottomNav({ className = "" }: BottomNavProps) {
  const [connectionState, setConnectionState] = useState<TeleConnectionState>(
    () => teleState.connectionState
  );
  const [activeMode, setActiveModeState] = useState<TeleActiveMode>(
    () => teleState.activeMode
  );

  const applyState = (
    cs: TeleConnectionState,
    am: TeleActiveMode,
    connected: boolean
  ) => {
    setConnectionState(cs);
    setActiveModeState(am);
    syncTeleState(cs, am, connected);
  };

  const handleTeleButton = async () => {
    if (connectionState !== "connected") return;
    if (activeMode === "tele") {
      await disconnectTele();
      applyState("idle", "none", false);
    } else {
      applyState("connected", "tele", true);
    }
  };

  const handleVoiceButton = async () => {
    if (connectionState !== "connected") return;
    if (activeMode === "voice") {
      await disconnectTele();
      applyState("idle", "none", false);
    } else {
      applyState("connected", "voice", true);
    }
  };

  const handleChatButton = async () => {
    if (connectionState !== "connected") return;
    if (activeMode === "chat") {
      await disconnectTele();
      applyState("idle", "none", false);
    } else {
      applyState("connected", "chat", true);
    }
  };

  const connected = connectionState === "connected";
  const teleActive = activeMode === "tele" && connected;
  const voiceActive = activeMode === "voice" && connected;
  const chatActive = activeMode === "chat" && connected;

  return (
    <div data-testid="bottom-nav" className={cn("relative h-10 w-[168px]", className)}>
      <div
        data-testid="bottom-nav-pill"
        className={cn(
          "absolute inset-0 flex items-center rounded-[100px]",
          "no-lightboard bg-[var(--accent-contrast)] border border-[var(--border-card)] [box-shadow:var(--shadow-bottom-nav-pill)]",
        )}
      >
        <button
          data-testid="bottom-nav-tele-btn"
          onClick={handleTeleButton}
          className={cn(
            "flex-1 flex h-full items-center justify-center rounded-[100px] no-lightboard transition-colors",
            teleActive ? ACTIVE : INACTIVE,
          )}
          aria-label={teleActive ? "Disconnect Tele" : "Switch to Tele"}
        >
          <SparklesIcon />
        </button>

        <button
          data-testid="bottom-nav-voice-btn"
          onClick={handleVoiceButton}
          className={cn(
            "flex-1 flex h-full items-center justify-center rounded-[100px] no-lightboard transition-colors",
            voiceActive ? ACTIVE : INACTIVE,
          )}
          aria-label={voiceActive ? "Disconnect voice" : "Voice only"}
        >
          <SoundwaveIcon />
        </button>

        <button
          data-testid="bottom-nav-chat-btn"
          onClick={handleChatButton}
          className={cn(
            "flex-1 flex h-full items-center justify-center rounded-[100px] no-lightboard transition-colors",
            chatActive ? ACTIVE : INACTIVE,
          )}
          aria-label={chatActive ? "Disconnect chat" : "Chat"}
        >
          <ChatIcon />
        </button>
      </div>
    </div>
  );
}
