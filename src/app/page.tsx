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
      // Start the voice connection
      await connect();
      
      // Mount TalentApp immediately (this initializes the template system)
      setJourney("talent");
      
      // Hide connecting screen after a brief delay
      setTimeout(() => {
        setShowConnecting(false);
      }, 1500);
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
      
      {showConnecting && <ConnectingScreen key="connecting-overlay" />}
    </>
  );
}
