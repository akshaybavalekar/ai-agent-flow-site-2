'use client';

/**
 * TeleSpeechContext — provides a singleton speech state for all components.
 * Adapted from trainco-v1 to read from the voice-session-store transcripts
 * instead of UIFramework DataReceived events.
 */

import {
  createContext,
  useCallback,
  useContext,
  useState,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { useVoiceSessionStore } from "@/platform/stores/voice-session-store";

export interface TeleSpeechState {
  speech: string | null;
  isTalking: boolean;
  speechBubbleBottomPx: number | null;
}

export interface TeleSpeechContextValue extends TeleSpeechState {
  setSpeechBubbleBottomPx: (px: number | null) => void;
  getLastSpeechAt: () => number;
  speechDisplayOverride: string | null;
  setSpeechDisplayOverride: (value: string | null) => void;
}

const TeleSpeechContext = createContext<TeleSpeechContextValue>({
  speech: null,
  isTalking: false,
  speechBubbleBottomPx: null,
  setSpeechBubbleBottomPx: () => {},
  getLastSpeechAt: () => 0,
  speechDisplayOverride: null,
  setSpeechDisplayOverride: () => {},
});

export function TeleSpeechProvider({ children }: { children: ReactNode }) {
  const [speech, setSpeech] = useState<string | null>(null);
  const [isTalking, setIsTalking] = useState(false);
  const [speechBubbleBottomPx, setSpeechBubbleBottomPx] = useState<number | null>(null);
  const [speechDisplayOverride, setSpeechDisplayOverride] = useState<string | null>(null);
  const lastSpeechAtRef = useRef(0);
  const agentState = useVoiceSessionStore((s) => s.agentState);
  const transcripts = useVoiceSessionStore((s) => s.transcripts);

  const getLastSpeechAt = useCallback(() => lastSpeechAtRef.current, []);

  // Sync isTalking from agent state
  useEffect(() => {
    const talking = agentState === 'speaking';
    setIsTalking(talking);
    if (talking) {
      lastSpeechAtRef.current = Date.now();
    }
  }, [agentState]);

  // Sync speech from transcripts (latest agent transcript)
  useEffect(() => {
    const agentTranscripts = transcripts.filter((t) => t.isAgent);
    if (agentTranscripts.length === 0) return;
    const latest = agentTranscripts[agentTranscripts.length - 1];
    if (latest?.text) {
      setSpeech(latest.text);
    }
  }, [transcripts]);

  // Listen to tele-navigate-section to clear stale speech
  useEffect(() => {
    const NAVIGATE_CLEAR_DELAY_MS = 8000;
    const DASHBOARD_JOURNEY_TEMPLATES = new Set([
      "Dashboard", "ProfileSheet", "JobSearchSheet", "JobDetailSheet",
      "EligibilitySheet", "CloseGapSheet", "JobApplicationsSheet", "PastApplicationsSheet",
      "SkillCoverageSheet", "SkillTestFlow", "MarketRelevanceSheet", "CareerGrowthSheet",
      "SkillsDetail", "MarketRelevanceDetail", "CareerGrowthDetail",
    ]);
    let clearTimer: ReturnType<typeof setTimeout> | null = null;

    const onNavigate = (e: Event) => {
      const detail = (e as CustomEvent<{ templateIds?: string[] }>).detail;
      const templateIds = detail?.templateIds ?? [];
      const isDashboardJourney = templateIds.some((id) => DASHBOARD_JOURNEY_TEMPLATES.has(id));
      if (!isDashboardJourney) return;

      const navigateAt = Date.now();
      if (clearTimer) clearTimeout(clearTimer);
      clearTimer = setTimeout(() => {
        if (lastSpeechAtRef.current > navigateAt - 5000) return;
        setSpeech(null);
        clearTimer = null;
      }, NAVIGATE_CLEAR_DELAY_MS);
    };

    window.addEventListener("tele-navigate-section", onNavigate);
    return () => {
      window.removeEventListener("tele-navigate-section", onNavigate);
      if (clearTimer) clearTimeout(clearTimer);
    };
  }, []);

  return (
    <TeleSpeechContext.Provider
      value={{
        speech,
        isTalking,
        speechBubbleBottomPx,
        setSpeechBubbleBottomPx,
        getLastSpeechAt,
        speechDisplayOverride,
        setSpeechDisplayOverride,
      }}
    >
      {children}
    </TeleSpeechContext.Provider>
  );
}

export function useTeleSpeechContext(): TeleSpeechContextValue {
  return useContext(TeleSpeechContext);
}
