/**
 * Main dashboard template - shows after user completes onboarding.
 * This is a placeholder that would show the user's profile, job matches, etc.
 */
export function Dashboard() {
  const testNavigation = (templateId: string) => {
    const siteFns = (window as any).UIFrameworkSiteFunctions;
    if (siteFns?.navigateToSection) {
      console.log(`Testing navigation to ${templateId}...`);
      
      if (templateId === "GlassmorphicOptions") {
        siteFns.navigateToSection({
          templateId: "GlassmorphicOptions",
          props: {
            bubbles: [
              { label: "Test Option 1" },
              { label: "Test Option 2" },
              { label: "Back to Dashboard" }
            ],
            showProgress: true,
            progressStep: 1,
            progressTotal: 3
          }
        });
      } else {
        siteFns.navigateToSection({
          templateId,
          props: {}
        });
      }
    }
  };

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center">
      <div className="text-center text-white px-4">
        <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
        <p className="text-white/70 mb-8">Welcome to your career dashboard</p>
        
        <div className="grid grid-cols-1 gap-4 max-w-md mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <h3 className="font-semibold mb-2">Profile</h3>
            <p className="text-sm text-white/70">Complete your profile to get better matches</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <h3 className="font-semibold mb-2">Job Matches</h3>
            <p className="text-sm text-white/70">Discover opportunities tailored to your skills</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <h3 className="font-semibold mb-2">Skills</h3>
            <p className="text-sm text-white/70">Track your skill development progress</p>
          </div>
        </div>

        {/* Debug Navigation Buttons */}
        <div className="flex flex-col gap-2 max-w-md">
          <p className="text-xs text-white/50 mb-2">Test Navigation:</p>
          <button 
            onClick={() => testNavigation("WelcomeLanding")}
            className="bg-blue-500/20 hover:bg-blue-500/30 px-4 py-2 rounded-lg text-sm transition-colors"
          >
            → WelcomeLanding
          </button>
          <button 
            onClick={() => testNavigation("GlassmorphicOptions")}
            className="bg-green-500/20 hover:bg-green-500/30 px-4 py-2 rounded-lg text-sm transition-colors"
          >
            → GlassmorphicOptions
          </button>
        </div>
      </div>
    </div>
  );
}