/**
 * teleState — module-level singleton for Tele/voice connection state.
 * Adapts the reference trainco-v1 teleState to work with the voice-session-store.
 */

export type TeleConnectionState = "idle" | "connecting" | "connected";
export type TeleActiveMode = "none" | "tele" | "voice" | "chat";

export const teleState = {
  connected: false,
  connectionState: "idle" as TeleConnectionState,
  activeMode: "none" as TeleActiveMode,
};
