'use client';

import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence } from "motion/react";
import { BottomNav } from "./BottomNav";
import { TeleSpeechBubble } from "./TeleSpeechBubble";
import { DevToolbar } from "./DevToolbar";
import { TalentChatMode } from "./TalentChatMode";
import { DashboardBtn } from "@/components/ui/DashboardBtn";
import { LearningBtn } from "@/components/ui/LearningBtn";
import { useTeleState } from "@/hooks/useTeleState";
import { useCurrentSection } from "@/contexts/CurrentSectionContext";
import { useVisualViewportBottomInset } from "@/hooks/useVisualViewportBottomInset";
import type { GenerativeSection } from "@/types/flow";
import { BackgroundLayer } from "@/components/voice/BackgroundLayer";

const ONBOARDING_TEMPLATES = new Set([
  "EmptyScreen", "WelcomeLanding", "GlassmorphicOptions", "MultiSelectOptions",
  "TextInput", "RegistrationForm", "LoadingGeneral", "LoadingLinkedIn",
  "CandidateSheet", "CardStack",
]);

const HIDE_TOP_PERSISTENT_NAV = new Set<string>([]);
const HIDE_BOTTOM_NAV = new Set(["JobDetailSheet"]);

interface BaseLayoutProps {
  children: ReactNode;
  sections?: GenerativeSection[];
}

export function BaseLayout({ children, sections = [] }: BaseLayoutProps) {
  const { connectionState, connected } = useTeleState();
  const [chatMode, setChatMode] = useState(false);
  useVisualViewportBottomInset();

  const { effectiveTemplateId } = useCurrentSection();
  const showNavButtons =
    !!effectiveTemplateId &&
    !ONBOARDING_TEMPLATES.has(effectiveTemplateId) &&
    !HIDE_TOP_PERSISTENT_NAV.has(effectiveTemplateId ?? "");

  const showBottomNav =
    !!effectiveTemplateId && !HIDE_BOTTOM_NAV.has(effectiveTemplateId ?? "");

  useEffect(() => {
    const handleModeChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ activeMode: string }>;
      setChatMode(customEvent.detail.activeMode === "chat");
    };

    window.addEventListener("tele-mode-changed", handleModeChange);
    return () => window.removeEventListener("tele-mode-changed", handleModeChange);
  }, []);

  useEffect(() => {
    const stripInjectedCtaStyles = (scope?: ParentNode) => {
      const targets = (scope ?? document).querySelectorAll<HTMLElement>(".no-lightboard");
      targets.forEach((el) => {
        if (el instanceof HTMLButtonElement && el.disabled) return;
        const tid = el.getAttribute("data-testid") ?? "";
        const isEdgeGradient =
          tid === "base-layout-gradient-bottom" || tid === "base-layout-gradient-top";
        el.style.removeProperty("background-color");
        el.style.removeProperty("border-color");
        el.style.removeProperty("box-shadow");
        el.style.removeProperty("opacity");
        if (isEdgeGradient) {
          if (el.style.backgroundImage === "none") {
            el.style.removeProperty("background-image");
          }
        } else {
          el.style.removeProperty("background-image");
        }
      });
    };

    stripInjectedCtaStyles();

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "attributes" && mutation.target instanceof HTMLElement) {
          const target = mutation.target;
          if (target.matches(".no-lightboard") || target.closest(".no-lightboard")) {
            stripInjectedCtaStyles();
            return;
          }
        }

        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) return;
          if (node.matches(".no-lightboard") || node.querySelector(".no-lightboard")) {
            stripInjectedCtaStyles(node);
          }
        });
      }
    });

    observer.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["style", "class", "disabled", "aria-busy"],
    });

    return () => observer.disconnect();
  }, []);

  const handleSendChatMessage = (text: string) => {
    const fw = (window as unknown as { UIFramework?: { TellTele?: (t: string) => void } }).UIFramework;
    if (!fw) return;
    if (typeof fw.TellTele === "function") {
      fw.TellTele(text);
    }
  };

  // Suppress unused warning — connectionState is read for side-effects
  void connectionState;

  return (
    <div
      data-testid="base-layout"
      className="relative isolate w-screen h-[100svh] overflow-hidden bg-[var(--bg)]"
    >
      {/*
        LiveKit avatar video + hero still (see BackgroundLayer). Uses z-0 inside isolate so
        it paints above this shell’s background. Replace files under public/avatar/ for art.
      */}
      <div data-testid="base-layout-avatar-photo" className="absolute inset-0 z-0 overflow-hidden">
        <BackgroundLayer />
      </div>

      <div
        data-testid="base-layout-gradient-bottom"
        className="absolute left-0 right-0 bottom-0 z-[10] pointer-events-none no-lightboard"
        style={{ height: "28%" }}
      />
      <div
        data-testid="base-layout-gradient-top"
        className="absolute left-0 right-0 top-0 z-[10] pointer-events-none no-lightboard"
        style={{ height: "29%" }}
      />

      {!chatMode && <TeleSpeechBubble />}

      {!chatMode && (
        <div
          data-testid="base-layout-content"
          className="absolute inset-0 z-[1] flex min-h-0 flex-col"
        >
          {children}
        </div>
      )}

      {!chatMode && showNavButtons && (
        <div className="fixed inset-0 pointer-events-none no-lightboard" style={{ zIndex: 120 }}>
          <DashboardBtn />
          <LearningBtn />
        </div>
      )}

      <AnimatePresence>
        {chatMode && (
          <TalentChatMode
            key="chat-mode"
            onSend={handleSendChatMessage}
            sessionReady={connected}
            sections={sections}
          />
        )}
      </AnimatePresence>

      <div
        data-testid="base-layout-bottom-nav"
        className="absolute left-1/2 -translate-x-1/2 z-[115] flex flex-col items-center gap-2"
        style={{
          bottom:
            "calc(12px + env(safe-area-inset-bottom, 0px) + var(--vv-bottom-inset, 0px))",
        }}
      >
        <DevToolbar />
        {showBottomNav ? <BottomNav /> : null}
      </div>
    </div>
  );
}
