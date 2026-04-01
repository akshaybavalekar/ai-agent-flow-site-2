'use client';

import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from "react";
import {
  registerCacheAccessors,
  unregisterCacheAccessors,
  type McpCache,
  EMPTY_CACHE,
} from "@/platform/mcpCacheBridge";

interface McpCacheContextValue {
  cache: McpCache;
  loadIntoCache: (key: keyof McpCache, value: unknown) => void;
  readCache: () => McpCache;
  resetCache: () => void;
}

const McpCacheContext = createContext<McpCacheContextValue>({
  cache: EMPTY_CACHE,
  loadIntoCache: () => {},
  readCache: () => EMPTY_CACHE,
  resetCache: () => {},
});

export function McpCacheProvider({ children }: { children: ReactNode }) {
  const [cache, setCache] = useState<McpCache>(EMPTY_CACHE);
  const cacheRef = useRef<McpCache>(EMPTY_CACHE);

  const loadIntoCache = useCallback((key: keyof McpCache, value: unknown) => {
    setCache((prev) => {
      const next = { ...prev, [key]: value };
      cacheRef.current = next;
      return next;
    });
  }, []);

  const readCache = useCallback(() => cacheRef.current, []);

  const resetCache = useCallback(() => {
    setCache(EMPTY_CACHE);
    cacheRef.current = EMPTY_CACHE;
  }, []);

  useEffect(() => {
    registerCacheAccessors(loadIntoCache, readCache);
    return () => { unregisterCacheAccessors(); };
  }, [loadIntoCache, readCache]);

  // Reset cache on real disconnect
  useEffect(() => {
    let wasConnected = false;
    const onConnectionChange = (e: Event) => {
      const connected = (e as CustomEvent<{ connected: boolean }>).detail.connected;
      if (!connected && wasConnected) {
        resetCache();
      }
      wasConnected = connected;
    };
    window.addEventListener("tele-connection-changed", onConnectionChange);
    return () => window.removeEventListener("tele-connection-changed", onConnectionChange);
  }, [resetCache]);

  return (
    <McpCacheContext.Provider value={{ cache, loadIntoCache, readCache, resetCache }}>
      {children}
    </McpCacheContext.Provider>
  );
}

export function useMcpCache(): McpCache {
  return useContext(McpCacheContext).cache;
}

export function useMcpCacheActions() {
  const { loadIntoCache, readCache, resetCache } = useContext(McpCacheContext);
  return { loadIntoCache, readCache, resetCache };
}
