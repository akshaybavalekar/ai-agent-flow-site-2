'use client';

import { motion } from "motion/react";

export function ConnectingScreen() {
  return (
    <motion.div
      key="connecting"
      className="fixed inset-0 z-[200] overflow-hidden flex flex-col items-center justify-center"
      style={{ background: "var(--bg)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div
        className="absolute rounded-full animate-pulse pointer-events-none"
        style={{
          width: 560,
          height: 560,
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          background:
            "radial-gradient(circle, rgba(30,210,94,0.18) 0%, transparent 70%)",
          filter: "blur(80px)",
        }}
      />

      <div className="relative flex items-center justify-center">
        <div
          className="absolute rounded-full animate-pulse"
          style={{
            width: 120,
            height: 120,
            background: "rgba(30,210,94,0.15)",
            filter: "blur(24px)",
          }}
        />

        <div
          className="absolute rounded-full animate-spin"
          style={{
            width: 148,
            height: 148,
            border: "1.5px solid rgba(30,210,94,0.15)",
            borderTopColor: "var(--accent-strong)",
            animationDuration: "2.4s",
          }}
        />

        <div
          className="absolute rounded-full animate-spin"
          style={{
            width: 180,
            height: 180,
            border: "1px solid rgba(30,210,94,0.08)",
            borderTopColor: "rgba(30,210,94,0.35)",
            animationDuration: "4s",
            animationDirection: "reverse",
          }}
        />

        <span
          className="relative font-bold tracking-tight leading-none select-none"
          style={{ fontSize: 48, color: "#fff" }}
        >
          tr<span style={{ color: "var(--accent-strong)" }}>AI</span>n
        </span>
      </div>

      <p
        className="absolute font-medium tracking-wide text-sm"
        style={{
          color: "var(--text-muted)",
          bottom: "calc(48% - 100px)",
        }}
      >
        Connecting...
      </p>
    </motion.div>
  );
}
