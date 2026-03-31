'use client';

import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { EntryPoint } from '@/components/EntryPoint';
import { ConnectingScreen } from '@/components/ConnectingScreen';
import { TalentApp } from '@/components/TalentApp';
import { useVoiceSessionStore } from '@/lib/stores/voice-session-store';

type Journey = "landing" | "connecting" | "talent";

export default function Home() {
  const [journey, setJourney] = useState<Journey>("landing");
  const [showConnecting, setShowConnecting] = useState(false);
  
  const connect = useVoiceSessionStore((s) => s.connect);
  const sessionState = useVoiceSessionStore((s) => s.sessionState);

  // Handle the Begin button - start voice connection and mount TalentApp
  const handleBegin = async () => {
    setShowConnecting(true);
    setJourney("connecting");
    
    try {
      // Show connecting screen for a minimum time
      const connectPromise = connect();
      const minTimePromise = new Promise(resolve => setTimeout(resolve, 2000));
      
      // Wait for both connection and minimum display time
      await Promise.all([connectPromise, minTimePromise]);
      
      // Mount TalentApp (this initializes the template system)
      setJourney("talent");
      setShowConnecting(false);
    } catch (error) {
      console.error('Connection failed:', error);
      setJourney("landing");
      setShowConnecting(false);
    }
  };

  // Return to landing when disconnected
  useEffect(() => {
    if (sessionState === 'idle' && journey === 'talent') {
      setJourney('landing');
    }
  }, [sessionState, journey]);

  return (
    <>
      <AnimatePresence mode="wait">
        {journey === "landing" && (
          <EntryPoint key="landing" onBegin={handleBegin} />
        )}
        {journey === "connecting" && (
          <ConnectingScreen key="connecting" />
        )}
        {journey === "talent" && (
          <motion.div
            key="talent"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full"
          >
            <TalentApp />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Additional connecting overlay if needed */}
      {showConnecting && journey !== "connecting" && (
        <ConnectingScreen key="connecting-overlay" />
      )}
    </>
  );
}
