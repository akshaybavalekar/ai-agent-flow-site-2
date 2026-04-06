/**
 * teleIntent — selection/intent helpers for templates.
 * Adapted from trainco-v1.
 */

import { notifyTele, teleAcknowledge, type NotifyTeleOptions } from "@/utils/teleUtils";

export function getLinkedInPlaceholderEmail(): string {
  return "linkedin_demo@trainco.com";
}

export type SendLinkedInContinueOptions = {
  steerModel?: boolean;
};

export type SelectionIntentJobContext = {
  jobId: string;
  title: string;
  company: string;
};

export function sendSelectionIntent(
  label: string,
  jobContext?: SelectionIntentJobContext,
  notifyOptions?: NotifyTeleOptions,
): Promise<void> {
  window.dispatchEvent(
    new CustomEvent("user-selection", {
      detail:
        jobContext != null
          ? { selection: label, jobId: jobContext.jobId, title: jobContext.title, company: jobContext.company }
          : { selection: label },
    }),
  );
  const base = `user selected: ${label}`;
  const msg =
    jobContext != null
      ? `${base} | jobId:${jobContext.jobId} | ${jobContext.title} at ${jobContext.company}`
      : base;
  return notifyTele(msg, notifyOptions);
}

export function sendLinkedInContinueIntent(
  email = getLinkedInPlaceholderEmail(),
  options?: SendLinkedInContinueOptions,
): Promise<void> {
  if (options?.steerModel) {
    // Voice path: user spoke the command — the voice recognition already created
    // an agent turn. Steer it to HARD STOP and await "candidate ready".
    void teleAcknowledge(
      "[SYSTEM] LinkedIn path (voice). " +
        "The UI is handling findCandidate + getCandidate automatically — do NOT call any backend tools. " +
        "HARD STOP and await the `[SYSTEM] candidate ready` data-channel signal before speaking.",
      { visible: false },
    );
  }
  // Click path: no additional signal sent to the agent here.
  // The `linkedin-continue` DOM event resets the speaking counter and block flag.
  // The real agent turn fires via notifyTele once findCandidate resolves.
  return notifyTele(`user clicked: Continue with LinkedIn | email: ${email}`, {
    skipNavigateDrift: true,
  });
}

export function sendRegistrationEmailIntent(email: string): Promise<void> {
  return notifyTele(`user registered with email: ${email}`, {
    skipNavigateDrift: true,
  });
}

export function sendTappedIntent(target: string): Promise<void> {
  return notifyTele(`user clicked: ${target}`);
}

export function sendDashboardIntent(): Promise<void> {
  return notifyTele("user clicked: dashboard");
}

export function sendBackToProfileIntent(): Promise<void> {
  return notifyTele("user clicked: back to profile");
}

export function sendLooksGoodClickedIntent(): Promise<void> {
  return notifyTele("user clicked: Looks Good");
}

export function sendJobOpenedIntent(title: string, company: string): Promise<void> {
  return notifyTele(`user opened job: ${title} at ${company}`, { skipNavigateDrift: true });
}

export function sendJobClosedIntent(title: string, company: string): Promise<void> {
  return notifyTele(`user closed job: ${title} at ${company}`, { skipNavigateDrift: true });
}

export function sendCardsDismissedIntent(): Promise<void> {
  return notifyTele("user tapped: cards");
}

export function sendInvalidOptionVoiceIntent(): Promise<void> {
  return notifyTele(
    "[SYSTEM] User spoke but did not select a valid option. " +
      "Please repeat the question and wait for a bubble selection."
  );
}
