/**
 * teleConnect — adapts the reference trainco-v1 Tele connection API
 * to work with the voice-session-store (Mobeus/LiveKit).
 */

import { teleState, type TeleConnectionState, type TeleActiveMode } from "@/platform/teleState";
import { useVoiceSessionStore } from "@/platform/stores/voice-session-store";

/** Write state to singleton and dispatch connection events (same API as trainco-v1). */
export function syncTeleState(
  connectionState: TeleConnectionState,
  activeMode: TeleActiveMode,
  connected: boolean
) {
  if (
    teleState.connectionState === connectionState &&
    teleState.activeMode === activeMode &&
    teleState.connected === connected
  ) return;

  teleState.connectionState = connectionState;
  teleState.activeMode = activeMode;
  teleState.connected = connected;

  window.dispatchEvent(
    new CustomEvent("tele-connection-changed", { detail: { connected } })
  );
  window.dispatchEvent(
    new CustomEvent("tele-mode-changed", { detail: { activeMode } })
  );
}

/** Disconnect the voice session. */
export async function disconnectTele() {
  const { disconnect } = useVoiceSessionStore.getState();
  await disconnect();
  syncTeleState("idle", "none", false);
}

/** Connect the voice session. */
export async function connectTele(
  _greetingPrompt?: string,
  onAvatarReady?: () => void
) {
  const { connect } = useVoiceSessionStore.getState();
  syncTeleState("connecting", "tele", false);
  try {
    await connect();
    syncTeleState("connected", "tele", true);
    onAvatarReady?.();
  } catch (err) {
    console.error("[teleConnect] Connection failed:", err);
    syncTeleState("idle", "none", false);
    throw err;
  }
}
