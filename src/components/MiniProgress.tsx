'use client';

interface MiniProgressProps {
  step: number;
  total: number;
}

export function MiniProgress({ step, total }: MiniProgressProps) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className="rounded-full transition-all duration-300"
          style={{
            width: i === step ? 16 : 6,
            height: 6,
            background: i === step
              ? "var(--accent)"
              : i < step
              ? "var(--accent-muted)"
              : "rgba(255,255,255,0.15)",
          }}
        />
      ))}
    </div>
  );
}
