'use client';

/**
 * FlowScreenLayout
 *
 * Full-screen layout for all welcome / onboarding flow steps.
 * Renders the avatar background, radial glow, progress dots,
 * question pill, and the bottom nav bar.
 * Mobeus / Tele voice hooks have been removed — this is pure UI.
 */

import { type ReactNode } from 'react';

const farahSrc = '/avatars/farah.png';
const rayanSrc = '/avatars/rayan.png';

const FLOW_PROGRESS: Record<string, number> = {
  welcome:    1,
  onboarding: 2,
  dashboard:  3,
  jobs:       4,
};

// ── AvatarLayer ───────────────────────────────────────────────────────────────

function AvatarLayer({ avatarSrc, blurAvatar }: { avatarSrc: string; blurAvatar: boolean }) {
  return (
    <div
      className={`absolute left-0 top-0 w-full h-full pointer-events-none${blurAvatar ? ' blur-[6px]' : ''}`}
      aria-hidden="true"
    >
      {/* Radial green glow */}
      <div
        className="absolute inset-x-0 pointer-events-none"
        style={{
          top: 0,
          height: '90%',
          background:
            'radial-gradient(ellipse 85% 58% at 50% 42%, #0e5e38 0%, #083920 32%, #041208 58%, transparent 78%)',
        }}
      />
      <div
        className="absolute"
        style={{ top: '27.9%', left: '6.4%', width: '87.5%', height: '71.2%' }}
      >
        <img
          src={avatarSrc}
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-top"
        />
      </div>
    </div>
  );
}

// ── QuestionPill ──────────────────────────────────────────────────────────────

function QuestionPill({ question, questionWrap }: { question: string; questionWrap: boolean }) {
  return (
    <div
      className={`absolute left-1/2 -translate-x-1/2 bg-[rgba(39,39,42,0.5)] px-[16px] py-[12px] overflow-hidden ${questionWrap ? 'rounded-[24px] w-[calc(100%-32px)]' : 'rounded-[100px]'}`}
      style={{ top: '16.3%' }}
    >
      <p
        className={`font-light text-[16px] leading-[24px] text-white text-center tracking-[-0.3125px] shrink-0${questionWrap ? ' whitespace-pre-wrap' : ''}`}
        style={{ fontFamily: 'Inter, sans-serif' }}
      >
        {question}
      </p>
    </div>
  );
}

// ── BottomNavBar (simplified — manual mode only, no Tele) ─────────────────────

function SparkleIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="-rotate-90 text-[#1ed25e]">
      <path
        d="M7.5 5.6L10 7 8.6 4.5 10 2 7.5 3.4 5 2l1.4 2.5L5 7zm12 9.8L17 14l1.4 2.5L17 19l2.5-1.4L22 19l-1.4-2.5L22 14zM22 2l-2.5 1.4L17 2l1.4 2.5L17 7l2.5-1.4L22 7l-1.4-2.5zm-7.63 5.29a1 1 0 00-1.41 0L1.29 18.96a1 1 0 000 1.41l2.34 2.34c.39.39 1.02.39 1.41 0L16.7 11.05a1 1 0 000-1.41l-2.33-2.35zm-1.03 5.49l-2.12-2.12 2.44-2.44 2.12 2.12-2.44 2.44z"
        fill="currentColor"
      />
    </svg>
  );
}

function BottomNavBar() {
  return (
    <div className="absolute left-1/2 -translate-x-1/2 w-40" style={{ bottom: '2.5%' }}>
      <div className="relative h-[40px]">
        <div className="absolute inset-0 bg-[#18181b] outline outline-1 outline-offset-[-1px] outline-zinc-800 flex items-center justify-center px-4 py-2 rounded-[100px] shadow-[0px_0px_8px_0px_rgba(255,255,255,0.25)]">
          <div className="size-[24px] flex items-center justify-center">
            <SparkleIcon />
          </div>
        </div>
        <div className="absolute top-0 left-0 flex items-center justify-center py-2 rounded-[100px] shadow-[0px_0px_8px_0px_rgba(30,210,94,1)] w-14 h-[40px] bg-zinc-900 outline outline-1 outline-offset-[-1px] outline-green-500">
          <SparkleIcon />
        </div>
      </div>
    </div>
  );
}

// ── FlowScreenLayout ──────────────────────────────────────────────────────────

interface FlowScreenLayoutProps {
  question: string;
  questionWrap?: boolean;
  flow: 'welcome' | 'onboarding' | 'jobs';
  avatar?: 'farah' | 'rayan';
  blurAvatar?: boolean;
  showProfileIcon?: boolean;
  hideProgress?: boolean;
  progressDots?: number;
  children?: ReactNode;
}

export function FlowScreenLayout({
  question,
  questionWrap = false,
  flow,
  avatar = 'rayan',
  blurAvatar = false,
  showProfileIcon = false,
  hideProgress = false,
  progressDots,
  children,
}: FlowScreenLayoutProps) {
  const greenDots = progressDots ?? FLOW_PROGRESS[flow] ?? 1;
  const avatarSrc = avatar === 'rayan' ? rayanSrc : farahSrc;

  return (
    <div className="w-full min-h-screen flex justify-center bg-[#0a0a0a]">
      <div
        className="relative w-full max-w-[440px] min-h-screen overflow-hidden bg-[#0a0a0a]"
        style={{ minHeight: '100svh' }}
      >
        <AvatarLayer avatarSrc={avatarSrc} blurAvatar={blurAvatar} />

        {/* Bottom fade gradient */}
        <div
          aria-hidden="true"
          className="absolute left-0 pointer-events-none"
          style={{
            top: '67%', width: '100%', height: '33%',
            background: 'linear-gradient(to bottom, rgba(10,10,10,0) 8.07%, #0a0a0a 76.27%)',
          }}
        />

        {/* Progress bar — 4 dots */}
        {!hideProgress && (
          <div
            className="absolute flex gap-[4px] items-center"
            style={{ top: '1.67%', left: '50%', transform: 'translateX(-50%)', width: '108px' }}
          >
            {[1, 2, 3, 4].map(i => (
              <div key={i} className={`flex-1 h-[8px] rounded-full ${i <= greenDots ? 'bg-[#1ed25e]' : 'bg-[#27272a]'}`} />
            ))}
          </div>
        )}

        {/* Profile icon */}
        {showProfileIcon && (
          <div
            className="absolute right-[16px] flex items-center justify-center bg-[#1c1c1e] border border-[#27272a] rounded-full overflow-hidden w-[40px] py-[8px]"
            style={{ top: '1.67%' }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-white/60" aria-hidden="true">
              <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" fill="currentColor" />
            </svg>
          </div>
        )}

        <QuestionPill question={question} questionWrap={questionWrap} />

        {children}

        <BottomNavBar />
      </div>
    </div>
  );
}

// ── FloatingBubble ────────────────────────────────────────────────────────────

interface FloatingBubbleProps {
  label: string;
  leftPct: number;
  topPct: number;
  onClick: () => void;
  primary?: boolean;
  selected?: boolean;
  animationIndex?: number;
}

export function FloatingBubble({
  label,
  leftPct,
  topPct,
  onClick,
  selected = false,
  animationIndex = 0,
}: FloatingBubbleProps) {
  return (
    <button
      onClick={onClick}
      className={[
        'absolute px-[16px] py-[12px] rounded-[24px]',
        'bg-[rgba(16,42,40,0.2)]',
        'text-[16px] font-medium leading-[24px] text-white text-center tracking-[-0.3125px]',
        'outline-none',
        'hover:bg-[rgba(16,42,40,0.55)] hover:border hover:border-[#1ed25e]/60',
        selected
          ? 'border border-[#1ed25e] shadow-[0px_0px_8px_0px_#1ed25e] bg-[rgba(16,42,40,0.55)]'
          : 'border border-transparent',
        'active:scale-95',
        'transition-[border-color,background-color,box-shadow,transform]',
        'animate-bubble-appear',
      ].join(' ')}
      style={{
        left: `${leftPct}%`,
        top: `${topPct}%`,
        fontFamily: 'Inter, sans-serif',
        animationDelay: `${animationIndex * 120}ms`,
      }}
    >
      {label}
    </button>
  );
}
