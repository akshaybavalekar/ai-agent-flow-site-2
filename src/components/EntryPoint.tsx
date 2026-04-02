'use client';

import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, Settings } from "lucide-react";
import { useState } from "react";

interface EntryPointProps {
  onBegin: () => void;
}

export function EntryPoint({ onBegin }: EntryPointProps) {
  const [showOptions, setShowOptions] = useState(false);
  const [optionsData, setOptionsData] = useState<any>(null);

  const handleOptionsClick = () => {
    try {
      // Call the getGreetingOptions site function
      const fn = (window as any).__siteFunctions?.getGreetingOptions;
      if (fn) {
        const result = fn();
        console.log('Options data:', result);
        
        // Extract the first subsection's props for display
        if (result?.generativeSubsections?.[0]) {
          const section = result.generativeSubsections[0];
          const bubbles = section.props.bubbles || [];
          const options = bubbles.map((b: any) => b.label).join('|');
          
          const displayData = {
            badge: result.badge,
            title: result.title,
            subtitle: result.subtitle,
            options: options
          };
          setOptionsData(displayData);
          setShowOptions(true);
        } else {
          console.error('Invalid response format from getGreetingOptions');
        }
      } else {
        console.error('getGreetingOptions function not found');
      }
    } catch (error) {
      console.error('Error calling getGreetingOptions:', error);
    }
  };
  return (
    <div
      className="relative w-screen h-[100svh] overflow-hidden flex flex-col"
      style={{ background: "var(--bg)" }}
    >
      <div
        className="absolute pointer-events-none"
        style={{
          inset: 0,
          background:
            "radial-gradient(ellipse 120% 80% at 50% 60%, rgba(16,42,40,0.55) 0%, rgba(16,42,40,0.15) 55%, transparent 80%)",
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          width: 540,
          height: 640,
          top: "10%",
          left: "50%",
          transform: "translateX(-50%)",
          background:
            "radial-gradient(ellipse at center, rgba(30,210,94,0.13) 0%, transparent 65%)",
          filter: "blur(60px)",
        }}
      />

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center gap-3 text-center"
        >
          <h1
            className="font-bold tracking-tight leading-none text-white select-none"
            style={{ fontSize: "clamp(72px, 22vw, 96px)" }}
          >
            tr<span style={{ color: "var(--accent-strong)" }}>AI</span>n
          </h1>

          <p
            className="text-lg sm:text-xl font-normal"
            style={{ color: "var(--text-muted)" }}
          >
            Where growth meets opportunity.
          </p>
        </motion.div>
      </div>

      <div className="relative z-10 flex flex-col items-center gap-4 pb-[calc(80px+env(safe-area-inset-bottom,0px))]">
        <motion.button
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          onClick={onBegin}
          className="flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-base shadow-lg transition-transform active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-strong)]"
          style={{
            background: "var(--accent)",
            color: "#18181b",
            boxShadow: "0 4px 24px rgba(29,197,88,0.3)",
          }}
        >
          Begin
          <ArrowRight size={16} />
        </motion.button>

        <motion.button
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
          onClick={handleOptionsClick}
          className="flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-base shadow-lg transition-transform active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          style={{
            background: "rgba(255,255,255,0.2)",
            color: "white",
            border: "2px solid rgba(255,255,255,0.4)",
            backdropFilter: "blur(10px)",
            boxShadow: "0 4px 24px rgba(255,255,255,0.1)",
          }}
        >
          Options
          <Settings size={16} />
        </motion.button>
      </div>

      {/* Options Modal */}
      <AnimatePresence>
        {showOptions && optionsData && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.8)" }}
          onClick={() => setShowOptions(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white rounded-2xl p-6 m-4 max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">{optionsData.title}</h2>
              <p className="text-gray-600">{optionsData.subtitle}</p>
              <div className="inline-block px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full mt-2">
                {optionsData.badge}
              </div>
            </div>

            <div className="space-y-3 mb-6">
              {optionsData.options?.split('|').map((option: string, index: number) => (
                <button
                  key={index}
                  className="w-full p-3 text-left rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors"
                  onClick={() => {
                    console.log('Selected option:', option);
                    setShowOptions(false);
                  }}
                >
                  <span className="text-gray-900 font-medium">{option}</span>
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowOptions(false)}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </motion.div>
        </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
