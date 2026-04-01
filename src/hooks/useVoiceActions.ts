'use client';

import { useCallback, useRef } from "react";
import { useVoiceTranscriptIntent } from "@/hooks/useVoiceTranscriptIntent";
import { scoreMatch, normalizeVoiceText, VOICE_MIN_SCORE, VOICE_MIN_MARGIN } from "@/utils/voiceMatch";

export interface VoiceAction {
  phrases: string[];
  action: () => void;
}

const COOLDOWN_MS = 2000;

export function useVoiceActions(actions: VoiceAction[], enabled = true): void {
  const lastFiredRef = useRef<number>(0);

  const onTranscript = useCallback(
    (transcript: string) => {
      const now = Date.now();
      if (now - lastFiredRef.current < COOLDOWN_MS) return;

      const normalized = normalizeVoiceText(transcript);
      if (!normalized) return;

      const scored = actions.map((entry) => {
        const best = entry.phrases.reduce((max, phrase) => {
          const s = scoreMatch(normalized, phrase);
          return s > max ? s : max;
        }, 0);
        return { entry, score: best };
      });

      scored.sort((a, b) => b.score - a.score);
      const best = scored[0];
      const second = scored[1];
      if (!best) return;

      const margin = second ? best.score - second.score : best.score;
      if (best.score < VOICE_MIN_SCORE || margin < VOICE_MIN_MARGIN) return;

      lastFiredRef.current = now;
      best.entry.action();
    },
    [actions],
  );

  useVoiceTranscriptIntent({ enabled, onTranscript });
}
