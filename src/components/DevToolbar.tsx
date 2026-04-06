'use client';

import { useState, useEffect, useRef, useCallback } from "react";
import { Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { useVoiceSessionStore } from "@/platform/stores/voice-session-store";

export function DevToolbar() {
  // Read mic mute state and the real LiveKit toggle directly from the store.
  // Previously this used window.UIFramework.toggleMute which is never assigned
  // in this codebase, so the mic was never actually muted despite the icon changing.
  const isMuted = useVoiceSessionStore((s) => s.isMuted);
  const toggleMute = useVoiceSessionStore((s) => s.toggleMute);

  const [teleMuted, setTeleMuted] = useState(false);
  const muteLoopRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const sweepAudioElements = useCallback((muted: boolean) => {
    document.querySelectorAll("audio, video").forEach((el) => {
      (el as HTMLMediaElement).muted = muted;
      (el as HTMLMediaElement).volume = muted ? 0 : 1;
    });
  }, []);

  const handleToggleMic = useCallback(() => {
    toggleMute();
  }, [toggleMute]);

  const handleToggleTele = useCallback(() => {
    const next = !teleMuted;
    sweepAudioElements(next);
    setTeleMuted(next);
  }, [teleMuted, sweepAudioElements]);

  useEffect(() => {
    if (teleMuted) {
      sweepAudioElements(true);
      muteLoopRef.current = setInterval(() => sweepAudioElements(true), 500);
    } else if (muteLoopRef.current) {
      clearInterval(muteLoopRef.current);
      muteLoopRef.current = null;
    }
    return () => {
      if (muteLoopRef.current) clearInterval(muteLoopRef.current);
    };
  }, [teleMuted, sweepAudioElements]);

  return (
    <div className="flex items-center gap-2 absolute left-[-110px] bottom-0">
      <button
        onClick={handleToggleMic}
        className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
        style={{
          background: isMuted ? "var(--error-surface)" : "var(--glass-btn)",
          border: isMuted ? "1px solid var(--error-border)" : "1px solid var(--glass-btn-border)",
        }}
        title={isMuted ? "Unmute mic" : "Mute mic"}
      >
        {isMuted ? (
          <MicOff size={14} className="text-red-400" />
        ) : (
          <Mic size={14} className="text-white/50" />
        )}
      </button>

      <button
        onClick={handleToggleTele}
        className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
        style={{
          background: teleMuted ? "var(--error-surface)" : "var(--glass-btn)",
          border: teleMuted ? "1px solid var(--error-border)" : "1px solid var(--glass-btn-border)",
        }}
        title={teleMuted ? "Unmute Tele" : "Mute Tele"}
      >
        {teleMuted ? (
          <VolumeX size={14} className="text-red-400" />
        ) : (
          <Volume2 size={14} className="text-white/50" />
        )}
      </button>
    </div>
  );
}
