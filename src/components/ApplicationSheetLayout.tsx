'use client';

import { type ReactNode, useMemo } from "react";
import { type JobApplication } from "@/mocks/jobApplicationData";
import { BaseSheetLayout } from "@/components/ui/BaseSheetLayout";
import { notifyTele } from "@/utils/teleUtils";
import { useSpeechFallbackNudge } from "@/hooks/useSpeechFallbackNudge";
import { useVoiceActions, type VoiceAction } from "@/hooks/useVoiceActions";
import { navigateClientToDashboardLanding } from "@/utils/clientDashboardNavigate";

interface ApplicationSheetLayoutProps {
  testId: string;
  title: string;
  subtitle: string;
  applications: JobApplication[];
  nudgeInstruction: string;
  nudgePhrases: string[];
  statusField: "statusLabel" | "statusDetail";
  renderCard: (app: JobApplication, onSelect: () => void) => ReactNode;
  extraVoiceActions?: VoiceAction[];
  sectionLabel?: string;
  emptyMessage?: string;
  footer?: ReactNode;
}

export function ApplicationSheetLayout({
  testId,
  title,
  subtitle,
  applications,
  nudgeInstruction,
  nudgePhrases,
  statusField,
  renderCard,
  extraVoiceActions = [],
  sectionLabel,
  emptyMessage = "No applications.",
  footer,
}: ApplicationSheetLayoutProps) {
  useSpeechFallbackNudge({
    enabled: true,
    requiredPhrases: nudgePhrases,
    matchMode: "any",
    instruction: nudgeInstruction,
    delayMs: 1200,
  });

  const handleClose = () => {
    navigateClientToDashboardLanding();
  };

  const appVoiceActions: VoiceAction[] = useMemo(
    () =>
      applications.map((app) => ({
        phrases: [
          app.jobTitle.toLowerCase(),
          `${app.jobTitle} at ${app.company}`.toLowerCase(),
          `${app.jobTitle} ${app.company}`.toLowerCase(),
        ],
        action: () =>
          notifyTele(
            `user selected application: ${app.jobTitle} at ${app.company} [status:${app[statusField]}]`,
          ),
      })),
    [applications, statusField],
  );

  useVoiceActions(
    useMemo(
      () => [
        { phrases: ["close", "dashboard", "go back", "back"], action: handleClose },
        ...extraVoiceActions,
        ...appVoiceActions,
      ],
      [extraVoiceActions, appVoiceActions],
    ),
  );

  return (
    <BaseSheetLayout
      testId={testId}
      onClose={handleClose}
      animate={false}
      scrollClassName="px-6 pt-4 pb-8"
      header={
        <div className="relative px-6 pt-8 pb-2">
          <h1 className="text-[var(--text-primary)] text-[28px] font-bold leading-9 mt-10">
            {title}
          </h1>
          <p className="text-[var(--text-subtle)] text-[15px] leading-5 mt-1">{subtitle}</p>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        {sectionLabel && (
          <h2 className="text-[var(--text-primary)] text-base font-semibold">{sectionLabel}</h2>
        )}
        {applications.length === 0 && (
          <p className="text-[var(--text-subtle)] text-sm text-center py-8">{emptyMessage}</p>
        )}
        {applications.map((app) =>
          renderCard(app, () =>
            notifyTele(
              `user selected application: ${app.jobTitle} at ${app.company} [status:${app[statusField]}]`,
            ),
          ),
        )}
        {footer}
      </div>
    </BaseSheetLayout>
  );
}
