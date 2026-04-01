/**
 * useTeleSpeech — thin wrapper around TeleSpeechContext.
 * All callers share the same isTalking/speech state.
 */
export type { TeleSpeechState } from "@/contexts/TeleSpeechContext";
export { useTeleSpeechContext as useTeleSpeech } from "@/contexts/TeleSpeechContext";
