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
    void teleAcknowledge(
      "[SYSTEM] LinkedIn path (voice). " +
        "Execute Step OB-6A: speak 'Connecting with LinkedIn…' and call navigateToSection with LoadingLinkedIn payload. " +
        "The frontend will attempt to pre-fetch candidate data. " +
        "If you receive '[SYSTEM] LinkedIn data ready', call navigateToSection with that exact payload immediately. " +
        "If you do NOT receive that signal within a few seconds, call find_candidate with email " +
        email +
        " yourself, extract the candidate_id, call get_candidate with that id, then call navigateToSection with CandidateSheet.",
      { visible: false },
    );
  }
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
