'use client';

import { useState, useEffect, useRef } from "react";
import { useTeleSpeech } from "@/hooks/useTeleSpeech";

interface SpeechGateOptions {
  silenceMs?: number;
  fallbackMs?: number;
  dismissSilenceMs?: number;
  hasInteracted?: boolean;
  /**
   * LiveAvatar / long TTS often keeps `agentState === 'speaking'`, so `isTalking` never clears and
   * the normal silence timer never arms — bubbles stay hidden forever. After this many ms from
   * mount, force `ready` so options can appear while the avatar is still “speaking”.
   */
  maxReadyWaitMs?: number;
}

interface SpeechGateResult {
  ready: boolean;
  dismissed: boolean;
  setDismissed: (v: boolean) => void;
}

export function useSpeechGate({
  silenceMs = 800,
  fallbackMs = 4000,
  dismissSilenceMs = 1500,
  hasInteracted = false,
  maxReadyWaitMs,
}: SpeechGateOptions = {}): SpeechGateResult {
  const { isTalking } = useTeleSpeech();
  const [ready, setReady] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const silenceStartRef = useRef<number | null>(null);
  const readyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxReadyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const becameVisibleAtRef = useRef<number | null>(null);
  const hasSpeechAfterMountRef = useRef(false);
  const mountTimeRef = useRef(Date.now());

  useEffect(() => {
    if (maxReadyWaitMs == null || dismissed) return;
    maxReadyTimerRef.current = setTimeout(() => {
      setReady((prev) => (prev ? prev : true));
      maxReadyTimerRef.current = null;
    }, maxReadyWaitMs);
    return () => {
      if (maxReadyTimerRef.current !== null) {
        clearTimeout(maxReadyTimerRef.current);
        maxReadyTimerRef.current = null;
      }
    };
  }, [maxReadyWaitMs, dismissed]);

  useEffect(() => {
    if (!dismissed && ready) {
      if (becameVisibleAtRef.current == null) {
        becameVisibleAtRef.current = Date.now();
      }
      return;
    }
    becameVisibleAtRef.current = null;
  }, [ready, dismissed]);

  useEffect(() => {
    if (!isTalking) {
      silenceStartRef.current = Date.now();
      const timeAlive = Date.now() - mountTimeRef.current;
      const speechGateCleared =
        hasSpeechAfterMountRef.current ||
        timeAlive > 2000 ||
        timeAlive < 500;

      if (!speechGateCleared) {
        readyTimerRef.current = setTimeout(
          () => setReady(true),
          Math.max(fallbackMs - timeAlive, silenceMs),
        );
      } else {
        readyTimerRef.current = setTimeout(() => setReady(true), silenceMs);
      }

      return () => {
        if (readyTimerRef.current !== null) {
          clearTimeout(readyTimerRef.current);
          readyTimerRef.current = null;
        }
      };
    }

    hasSpeechAfterMountRef.current = true;
    if (readyTimerRef.current !== null) {
      clearTimeout(readyTimerRef.current);
      readyTimerRef.current = null;
    }

    if (silenceStartRef.current !== null) {
      const silenceDuration = Date.now() - silenceStartRef.current;
      const hasBeenVisible = becameVisibleAtRef.current !== null;
      if (!hasInteracted && !dismissed && hasBeenVisible && silenceDuration > dismissSilenceMs) {
        setDismissed(true);
      }
    }
    silenceStartRef.current = null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTalking, hasInteracted, dismissed]);

  return { ready, dismissed, setDismissed };
}
