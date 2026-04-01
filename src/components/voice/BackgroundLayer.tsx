'use client';

import { useCallback, type CSSProperties } from 'react';
import { useVoiceSessionStore } from '@/platform/stores/voice-session-store';
import { assets } from '@/assets';

/**
 * Full-viewport hero still + LiveKit avatar video. Mount once inside a
 * `relative`/`isolate` shell (e.g. BaseLayout) so layers use z-0 — not z-index -1,
 * which paints behind the shell’s background and disappears.
 */
export function BackgroundLayer() {
  const sessionState = useVoiceSessionStore((s) => s.sessionState);
  const agentState = useVoiceSessionStore((s) => s.agentState);
  const avatarVideoTrack = useVoiceSessionStore((s) => s.avatarVideoTrack);
  const avatarVisible = useVoiceSessionStore((s) => s.avatarVisible);
  const avatarThumbnailUrl = useVoiceSessionStore((s) => s.avatarThumbnailUrl);

  const isConnected = sessionState === 'connected';
  const isConnecting = sessionState === 'connecting';
  const showPulse = isConnecting || (isConnected && agentState === 'thinking');
  // Show video when the worker publishes a track and the user hasn’t hidden the avatar.
  // Do not require avatarEnabled — API defaults often leave it false while video is live.
  const showAvatarVideo = avatarVisible && !!avatarVideoTrack;

  const bgImage = avatarThumbnailUrl || assets.backgroundHero;

  const videoRef = useCallback(
    (el: HTMLVideoElement | null) => {
      if (el && avatarVideoTrack) {
        avatarVideoTrack.attach(el);
      }
    },
    [avatarVideoTrack]
  );

  const layerStyle: CSSProperties = {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
  };

  return (
    <div
      data-testid="background-layer"
      className="pointer-events-none absolute inset-0 z-0 h-full w-full min-h-0 overflow-hidden"
    >
      {/* Base hero — fallback when avatar video is not active */}
      <div
        style={{
          ...layerStyle,
          zIndex: 0,
          backgroundImage: `url(${bgImage})`,
          backgroundPosition: 'right top',
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover',
          opacity: showAvatarVideo ? 0 : isConnected ? 1 : 0.8,
          filter: `brightness(var(--theme-video-brightness)) saturate(var(--theme-video-saturate))`,
          transition: 'opacity 0.6s ease, filter 0.6s ease',
        }}
      />

      {showAvatarVideo && (
        <div style={{ ...layerStyle, zIndex: 1 }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full"
            style={{
              objectFit: 'cover',
              objectPosition: 'right center',
              filter: `brightness(var(--theme-video-brightness)) saturate(var(--theme-video-saturate))`,
            }}
          />
        </div>
      )}

      {showPulse && !showAvatarVideo && (
        <div
          className="hero-pulse-overlay"
          style={{
            ...layerStyle,
            zIndex: 2,
            backgroundImage: `url(${bgImage})`,
            backgroundPosition: 'right top',
            backgroundRepeat: 'no-repeat',
            backgroundSize: 'cover',
            filter: `brightness(var(--theme-video-brightness)) saturate(var(--theme-video-saturate))`,
          }}
        />
      )}
    </div>
  );
}
