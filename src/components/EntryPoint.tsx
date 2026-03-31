import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

interface EntryPointProps {
  onBegin: () => void;
}

export function EntryPoint({ onBegin }: EntryPointProps) {
  return (
    <div
      className="relative w-screen h-[100svh] overflow-hidden flex flex-col"
      style={{ background: "var(--bg)" }}
    >
      {/* Green radial background glow — matches Figma's coloured backdrop */}
      <div
        className="absolute pointer-events-none"
        style={{
          inset: 0,
          background:
            "radial-gradient(ellipse 120% 80% at 50% 60%, rgba(16,42,40,0.55) 0%, rgba(16,42,40,0.15) 55%, transparent 80%)",
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          width: 540,
          height: 640,
          top: "10%",
          left: "50%",
          transform: "translateX(-50%)",
          background:
            "radial-gradient(ellipse at center, rgba(30,210,94,0.13) 0%, transparent 65%)",
          filter: "blur(60px)",
        }}
      />

      {/* Logo + tagline — centered vertically */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center gap-3 text-center"
        >
          {/* trAIn wordmark */}
          <h1
            className="font-bold tracking-tight leading-none text-white select-none"
            style={{ fontSize: "clamp(72px, 22vw, 96px)" }}
          >
            tr<span style={{ color: "var(--accent-strong)" }}>AI</span>n
          </h1>

          {/* Tagline */}
          <p
            className="text-lg sm:text-xl font-normal"
            style={{ color: "var(--text-muted)" }}
          >
            Where growth meets opportunity.
          </p>
        </motion.div>
      </div>

      {/* Begin button — pinned near the bottom */}
      <div className="relative z-10 flex flex-col items-center pb-[calc(80px+env(safe-area-inset-bottom,0px))]">
        <motion.button
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          onClick={onBegin}
          className="flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-base shadow-lg transition-transform active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-strong)]"
          style={{
            background: "var(--accent)",
            color: "#18181b",
            boxShadow: "0 4px 24px rgba(29,197,88,0.3)",
          }}
        >
          Begin
          <ArrowRight size={16} />
        </motion.button>
      </div>
    </div>
  );
}