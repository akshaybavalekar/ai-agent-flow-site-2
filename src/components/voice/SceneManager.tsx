'use client';

import { SceneLayout } from '@/components/voice/SceneLayout';
import { WelcomeLanding } from '@/components/voice/WelcomeLanding';
import { useVoiceSessionStore } from '@/lib/stores/voice-session-store';

export function SceneManager() {
  const currentScene = useVoiceSessionStore((s) => s.currentScene);
  const sessionState = useVoiceSessionStore((s) => s.sessionState);

  // If we have a scene from the AI, render it
  if (currentScene) {
    return (
      <SceneLayout>
        <div className="scene-content">
          {/* Render the scene content here */}
          <div className="p-4">
            <h2 className="text-white text-xl mb-4">AI Scene</h2>
            <pre className="text-white/70 text-sm whitespace-pre-wrap">
              {JSON.stringify(currentScene, null, 2)}
            </pre>
          </div>
        </div>
      </SceneLayout>
    );
  }

  // Otherwise show the welcome screen while waiting for AI
  return (
    <SceneLayout>
      <WelcomeLanding />
    </SceneLayout>
  );
}