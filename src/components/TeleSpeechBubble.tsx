'use client';

import { useState, useEffect, useRef } from "react";
import { AnimatePresence } from "motion/react";
import { QuestionBubble } from "./QuestionBubble";
import { useTeleState } from "@/hooks/useTeleState";
import { useCurrentSection } from "@/contexts/CurrentSectionContext";
import { useTeleSpeechContext } from "@/contexts/TeleSpeechContext";

const SPEECH_BUBBLE_TOP = 80;

const HIDDEN_BUBBLE_TEMPLATES = [
  "LoadingGeneral", "LoadingLinkedIn", "SkillCoverageSheet", "SkillTestFlow",
  "MarketRelevanceSheet", "CareerGrowthSheet", "MyLearningSheet", "JobSearchSheet",
  "JobDetailSheet", "JobApplicationsSheet", "PastApplicationsSheet", "CloseGapSheet",
  "TargetRoleSheet",
];

const DASHBOARD_PROFILE_FALLBACK_MS = 5000;
const DASHBOARD_LANDING_SECTION_ID = "profile-home";
const SHOW_DEBOUNCE_MS = 400;

export function TeleSpeechBubble() {
  const { effectiveTemplateId, currentSectionId } = useCurrentSection();
  const { speech, isTalking, setSpeechBubbleBottomPx, speechDisplayOverride } = useTeleSpeechContext();
  const isHidden = HIDDEN_BUBBLE_TEMPLATES.includes(effectiveTemplateId ?? "");
  const { connected: teleConnected } = useTeleState();
  const [beginCtaReady, setBeginCtaReady] = useState(false);
  const spokenOnCtaRef = useRef(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (currentSectionId !== DASHBOARD_LANDING_SECTION_ID) {
      setBeginCtaReady(false);
      spokenOnCtaRef.current = false;
      return;
    }
    const timer = setTimeout(() => {
      if (!spokenOnCtaRef.current) setBeginCtaReady(true);
    }, DASHBOARD_PROFILE_FALLBACK_MS);
    return () => clearTimeout(timer);
  }, [currentSectionId]);

  useEffect(() => {
    if (currentSectionId === DASHBOARD_LANDING_SECTION_ID && isTalking) {
      spokenOnCtaRef.current = true;
      setBeginCtaReady(false);
    }
  }, [currentSectionId, isTalking]);

  const isBeginCta =
    currentSectionId === DASHBOARD_LANDING_SECTION_ID && !isTalking && beginCtaReady;
  const onBeginCta = currentSectionId === DASHBOARD_LANDING_SECTION_ID;

  const resolvedSpeech =
    speech && speech.trim().length > 0 ? speech : speechDisplayOverride ?? null;

  const wantVisible =
    !isHidden &&
    (teleConnected || !!speechDisplayOverride?.trim()) &&
    (isTalking || (onBeginCta ? isBeginCta : !!resolvedSpeech?.trim()));

  const [showBubble, setShowBubble] = useState(false);
  useEffect(() => {
    if (wantVisible && !isHidden) {
      const t = setTimeout(() => setShowBubble(true), SHOW_DEBOUNCE_MS);
      return () => clearTimeout(t);
    }
    setShowBubble(false);
  }, [wantVisible, isHidden]);

  const visible = showBubble && !isHidden;
  const message = isBeginCta ? "Where should we begin?" : (resolvedSpeech ?? "");

  useEffect(() => {
    if (!visible) {
      setSpeechBubbleBottomPx(null);
      return;
    }
    const el = containerRef.current;
    if (!el) return;

    const updateBottom = () => {
      const h = el.offsetHeight;
      setSpeechBubbleBottomPx(SPEECH_BUBBLE_TOP + h);
    };

    updateBottom();
    const ro = new ResizeObserver(updateBottom);
    ro.observe(el);
    return () => ro.disconnect();
  }, [visible, message, setSpeechBubbleBottomPx]);

  if (isHidden) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      data-testid="tele-speech-bubble"
      className="absolute left-0 right-0 flex justify-center px-4 pointer-events-none"
      style={{ top: SPEECH_BUBBLE_TOP, zIndex: 60 }}
    >
      <AnimatePresence mode="wait">
        {visible && (
          <QuestionBubble
            key={resolvedSpeech ?? "__talking__"}
            text={message ?? ""}
            className="px-4 py-3 bg-zinc-800/50 rounded-[100px] inline-flex justify-center items-center gap-2 flex-wrap content-center overflow-hidden"
          />
        )}
      </AnimatePresence>
    </div>
  );
}
