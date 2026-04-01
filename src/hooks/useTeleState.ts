'use client';

import { useState, useEffect } from "react";
import { teleState, type TeleConnectionState, type TeleActiveMode } from "@/platform/teleState";

interface TeleStateResult {
  connected: boolean;
  connectionState: TeleConnectionState;
  activeMode: TeleActiveMode;
}

/**
 * Reactive hook for the global teleState singleton.
 * Subscribes to tele-connection-changed and tele-mode-changed custom events.
 */
export function useTeleState(): TeleStateResult {
  const [connected, setConnected] = useState(() => teleState.connected);
  const [connectionState, setConnectionState] = useState<TeleConnectionState>(() => teleState.connectionState);
  const [activeMode, setActiveMode] = useState<TeleActiveMode>(() => teleState.activeMode);

  useEffect(() => {
    setConnected(teleState.connected);
    setConnectionState(teleState.connectionState);
    setActiveMode(teleState.activeMode);

    const onConnection = () => {
      setConnected(teleState.connected);
      setConnectionState(teleState.connectionState);
    };

    const onMode = (e: Event) => {
      const mode = (e as CustomEvent<{ activeMode: string }>).detail.activeMode;
      setActiveMode(mode as TeleActiveMode);
    };

    window.addEventListener("tele-connection-changed", onConnection);
    window.addEventListener("tele-mode-changed", onMode);
    return () => {
      window.removeEventListener("tele-connection-changed", onConnection);
      window.removeEventListener("tele-mode-changed", onMode);
    };
  }, []);

  return { connected, connectionState, activeMode };
}
