/**
 * teleUtils — communication helpers for the voice agent.
 * Adapted from trainco-v1 to use the Mobeus/LiveKit voice-session-store.
 */

import { informTele } from "@/utils/informTele";
import { useVoiceSessionStore } from "@/platform/stores/voice-session-store";

export type NotifyTeleOptions = {
  skipNavigateDrift?: boolean;
};

/**
 * Sends a visible user message to the voice agent (equivalent to UIFramework.TellTele).
 * Dispatches teleThinkingStart event and adds to transcript.
 */
export async function notifyTele(
  message: string,
  options?: NotifyTeleOptions
): Promise<void> {
  try {
    window.dispatchEvent(
      new CustomEvent("teleThinkingStart", {
        detail: { skipNavigateDrift: options?.skipNavigateDrift === true },
      })
    );
  } catch (_) {}

  const { tellAgent } = useVoiceSessionStore.getState();
  await tellAgent(message);
}

/**
 * Sends invisible context to the voice agent (equivalent to UIFramework.informTele).
 * The user does not see this message.
 */
export { informTele };

/**
 * Sends a hidden high-priority instruction to the voice agent (equivalent to UIFramework.teleAcknowledge).
 */
export async function teleAcknowledge(
  instruction: string,
  _options: Record<string, unknown> = { visible: false }
): Promise<void> {
  const { informAgent } = useVoiceSessionStore.getState();
  await informAgent(instruction);
}

export const EVENT_NAVIGATE_POP_JOB_BROWSE = "navigate-pop-job-browse";

export function popJobBrowseScreen(): void {
  try {
    window.dispatchEvent(new CustomEvent(EVENT_NAVIGATE_POP_JOB_BROWSE));
  } catch (_) {}
}
