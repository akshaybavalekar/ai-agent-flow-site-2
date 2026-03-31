'use client';

import { useEffect } from 'react';

/**
 * Initial app state shown before the Runtime Agent connects.
 * Provides the visual shell — the background, glow, and BottomNav all live
 * in BaseLayout, so this component only renders the pre-connect hint text.
 *
 * The AI immediately replaces this with GlassmorphicOptions on first connection.
 */
export function WelcomeLanding() {
  // Simulate AI greeting flow following trainco journey-welcome.md
  useEffect(() => {
    console.log('WelcomeLanding mounted, setting up navigation timer...');
    
    const timer = setTimeout(() => {
      console.log('Timer fired, checking for UIFrameworkSiteFunctions...');
      const siteFns = (window as any).UIFrameworkSiteFunctions;
      console.log('UIFrameworkSiteFunctions:', siteFns);
      
      if (siteFns?.navigateToSection) {
        console.log('Calling navigateToSection with GlassmorphicOptions...');
        const result = siteFns.navigateToSection({
          badge: "trAIn CAREER",
          title: "Welcome",
          subtitle: "Let's get started",
          generativeSubsections: [{
            id: "start",
            templateId: "GlassmorphicOptions",
            props: {
              bubbles: [
                { label: "I'm ready to start" },
                { label: "Tell me more about trAIn" },
                { label: "I have questions" }
              ],
              showProgress: false
            }
          }]
        });
        console.log('navigateToSection result:', result);
      } else {
        console.error('navigateToSection not available!');
      }
    }, 1000); // Reduced to 1 second for testing

    return () => {
      console.log('WelcomeLanding unmounting, clearing timer');
      clearTimeout(timer);
    };
  }, []);

  return (
    <div
      data-testid="welcome-landing"
      className="absolute inset-0 flex flex-col items-center justify-end pointer-events-none"
      style={{
        paddingBottom:
          "calc(6.5rem + env(safe-area-inset-bottom, 0px))",
      }}
    >
      <div className="text-white/60 text-center px-4">
        <p className="text-lg mb-2">Welcome to trAIn</p>
        <p className="text-sm">Your AI career assistant is connecting...</p>
        <p className="text-xs mt-4 opacity-50">Navigation will happen automatically in 1 second...</p>
      </div>
    </div>
  );
}