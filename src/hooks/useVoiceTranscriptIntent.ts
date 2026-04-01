'use client';

import { useEffect, useRef } from "react";
import { useVoiceSessionStore } from "@/platform/stores/voice-session-store";

type TranscriptCallback = (transcript: string) => void;
const subscribers = new Set<TranscriptCallback>();
let prevTranscriptCount = 0;

interface UseVoiceTranscriptIntentOptions {
  enabled?: boolean;
  dedupeWindowMs?: number;
  onTranscript: (transcript: string) => void;
}

export function useVoiceTranscriptIntent({
  enabled = true,
  dedupeWindowMs = 1200,
  onTranscript,
}: UseVoiceTranscriptIntentOptions): void {
  const lastTranscriptRef = useRef<{ text: string; at: number } | null>(null);
  const onTranscriptRef = useRef(onTranscript);
  onTranscriptRef.current = onTranscript;

  const transcripts = useVoiceSessionStore((s) => s.transcripts);

  useEffect(() => {
    if (!enabled) return;

    // Check if new user transcript arrived
    const userTranscripts = transcripts.filter((t) => !t.isAgent && t.isFinal);
    if (userTranscripts.length <= prevTranscriptCount) return;

    prevTranscriptCount = userTranscripts.length;
    const latest = userTranscripts[userTranscripts.length - 1];
    if (!latest?.text) return;

    const transcript = latest.text.toLowerCase().trim();
    if (!transcript) return;

    const now = Date.now();
    const last = lastTranscriptRef.current;
    if (last && last.text === transcript && now - last.at < dedupeWindowMs) return;

    lastTranscriptRef.current = { text: transcript, at: now };
    subscribers.forEach((cb) => cb(transcript));
  }, [transcripts, enabled, dedupeWindowMs]);

  useEffect(() => {
    if (!enabled) return;

    const handler: TranscriptCallback = (transcript: string) => {
      onTranscriptRef.current(transcript);
    };

    subscribers.add(handler);
    return () => { subscribers.delete(handler); };
  }, [enabled]);
}
