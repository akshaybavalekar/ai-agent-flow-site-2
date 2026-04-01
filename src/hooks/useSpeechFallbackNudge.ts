'use client';

import { useEffect, useRef } from "react";
import { useTeleSpeech } from "@/hooks/useTeleSpeech";
import { useCurrentSection } from "@/contexts/CurrentSectionContext";
import { teleAcknowledge, informTele } from "@/utils/teleUtils";

type MatchMode = "any" | "all";

interface UseSpeechFallbackNudgeOptions {
  enabled?: boolean;
  instruction: string;
  requiredPhrases: string[];
  matchMode?: MatchMode;
  delayMs?: number;
  enableNavigateCheck?: boolean;
  instructionForMissingNavigate?: string;
}

const RETRY_INTERVAL_MS = 800;
const MAX_RETRIES = 8;
const RECENT_SPEECH_MS = 5000;

function sendNudge(text: string): void {
  void teleAcknowledge(text, { visible: false }).catch(() => {
    informTele(text);
  });
}

export function useSpeechFallbackNudge({
  enabled = true,
  instruction,
  requiredPhrases,
  matchMode = "any",
  delayMs = 1600,
  enableNavigateCheck = false,
  instructionForMissingNavigate,
}: UseSpeechFallbackNudgeOptions): void {
  const { speech, isTalking, getLastSpeechAt } = useTeleSpeech();
  const { currentSectionId } = useCurrentSection();
  const seenRef = useRef<Set<string>>(new Set());
  const hasFiredRef = useRef(false);
  const hasFiredNavigateRef = useRef(false);
  const isTalkingRef = useRef(isTalking);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retriesRef = useRef(0);
  const sectionWhenNavigateCheckStartedRef = useRef<string | undefined>(undefined);
  const currentSectionIdRef = useRef<string | undefined>(currentSectionId);
  const prevSectionResetRef = useRef<string | undefined>(undefined);
  currentSectionIdRef.current = currentSectionId;

  isTalkingRef.current = isTalking;

  useEffect(() => {
    if (currentSectionId === prevSectionResetRef.current) return;
    prevSectionResetRef.current = currentSectionId;
    seenRef.current = new Set();
    hasFiredRef.current = false;
    hasFiredNavigateRef.current = false;
    retriesRef.current = 0;
  }, [currentSectionId]);

  useEffect(() => {
    const text = (speech ?? "").toLowerCase();
    if (!text) return;
    for (const phrase of requiredPhrases) {
      if (!phrase) continue;
      if (text.includes(phrase.toLowerCase())) {
        seenRef.current.add(phrase.toLowerCase());
      }
    }
  }, [speech, requiredPhrases]);

  const hasRequiredSpeech = (): boolean => {
    if (requiredPhrases.length === 0) return false;
    const normalized = requiredPhrases.map((p) => p.toLowerCase());
    if (matchMode === "all") return normalized.every((p) => seenRef.current.has(p));
    return normalized.some((p) => seenRef.current.has(p));
  };

  useEffect(() => {
    if (!enabled || hasFiredRef.current) return;

    const attempt = () => {
      if (hasFiredRef.current) return;
      if (hasRequiredSpeech()) return;

      const recentlySpeaking =
        isTalkingRef.current || Date.now() - getLastSpeechAt() < RECENT_SPEECH_MS;

      if (recentlySpeaking && retriesRef.current < MAX_RETRIES) {
        retriesRef.current += 1;
        timerRef.current = setTimeout(attempt, RETRY_INTERVAL_MS);
        return;
      }

      hasFiredRef.current = true;
      sendNudge(instruction);
    };

    timerRef.current = setTimeout(attempt, delayMs);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [enabled, instruction, requiredPhrases, matchMode, delayMs, currentSectionId]);

  useEffect(() => {
    if (!enableNavigateCheck || !instructionForMissingNavigate || hasFiredNavigateRef.current) return;

    const sectionAtStart = currentSectionId;
    sectionWhenNavigateCheckStartedRef.current = sectionAtStart;
    navigateTimerRef.current = setTimeout(() => {
      if (hasFiredNavigateRef.current) return;
      if (!hasRequiredSpeech()) return;
      if (sectionWhenNavigateCheckStartedRef.current !== currentSectionIdRef.current) return;
      hasFiredNavigateRef.current = true;
      sendNudge(instructionForMissingNavigate);
    }, delayMs);

    return () => { if (navigateTimerRef.current) clearTimeout(navigateTimerRef.current); };
  }, [enableNavigateCheck, instructionForMissingNavigate, delayMs, currentSectionId]);
}
