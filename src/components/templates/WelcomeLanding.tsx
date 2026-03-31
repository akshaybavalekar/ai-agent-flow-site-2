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
    const timer = setTimeout(() => {
      const siteFns = (window as any).UIFrameworkSiteFunctions;
      if (siteFns?.navigateToSection) {
        console.log('Simulating AI Step 1 (Greeting) from journey-welcome...');
        // Following the trainco greeting flow
        siteFns.navigateToSection({
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
      }
    }, 3000);

    return () => clearTimeout(timer);
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
        <p className="text-xs mt-4 opacity-50">Navigation will happen automatically in 3 seconds...</p>
      </div>
    </div>
  );
}