'use client';

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { usePhaseFlow } from "@/hooks/usePhaseFlow";
import { DynamicSectionLoader } from "@/components/DynamicSectionLoader";
import { BaseLayout } from "@/components/BaseLayout";
import { CurrentSectionProvider } from "@/contexts/CurrentSectionContext";
import { ChatHistoryProvider } from "@/contexts/ChatHistoryContext";
import { EntryPoint } from "@/components/EntryPoint";
import { ConnectingScreen } from "@/components/ConnectingScreen";
import { connectTele, syncTeleState } from "@/platform/teleConnect";
import { teleState } from "@/platform/teleState";
import { registerSiteFunctions } from "@/site-functions/register";

type Journey = "landing" | "connecting" | "talent";

function TalentApp() {
  const { generativeSubsections } = usePhaseFlow();

  const lastSection = generativeSubsections[generativeSubsections.length - 1];
  const currentTemplateId = lastSection?.templateId;
  const currentSectionId = lastSection?.id;

  return (
    <ChatHistoryProvider sections={generativeSubsections}>
      <CurrentSectionProvider
        currentTemplateId={currentTemplateId}
        currentSectionId={currentSectionId}
      >
        <BaseLayout sections={generativeSubsections}>
          <DynamicSectionLoader sections={generativeSubsections} />
        </BaseLayout>
      </CurrentSectionProvider>
    </ChatHistoryProvider>
  );
}

export default function App() {
  const [journey, setJourney] = useState<Journey>("landing");
  const [showConnecting, setShowConnecting] = useState(false);

  // Install window.__siteFunctions on first paint so LiveKit RPC callSiteFunction always finds
  // registered handlers (stubs). usePhaseFlow overwrites navigateToSection with the real impl
  // when the talent shell mounts.
  useEffect(() => {
    registerSiteFunctions();
  }, []);

  useEffect(() => {
    const handleConnectionChange = () => {
      if (!teleState.connected && journey === "talent") {
        syncTeleState("idle", "none", false);
        setJourney("landing");
      }
    };

    window.addEventListener("tele-connection-changed", handleConnectionChange);
    return () =>
      window.removeEventListener("tele-connection-changed", handleConnectionChange);
  }, [journey]);

  const handleBegin = async () => {
    setShowConnecting(true);
    setJourney("connecting");
    syncTeleState("connecting", "tele", false);
    try {
      await connectTele(undefined, () => {
        syncTeleState("connected", "tele", true);
        setJourney("talent");
        setTimeout(() => setShowConnecting(false), 100);
      });
    } catch {
      syncTeleState("idle", "none", false);
      setJourney("landing");
      setShowConnecting(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {journey === "landing" && (
          <EntryPoint key="landing" onBegin={handleBegin} />
        )}
        {journey === "talent" && (
          <motion.div
            key="talent"
            className="w-screen h-[100svh] no-lightboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <TalentApp />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showConnecting && <ConnectingScreen key="connecting-overlay" />}
      </AnimatePresence>
    </>
  );
}
