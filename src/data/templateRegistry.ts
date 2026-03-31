import React from "react";

type AnyTemplate = React.ComponentType<Record<string, unknown>>;

/**
 * Maps templateId strings (sent by the Runtime Agent via navigateToSection) to
 * lazy-loaded React components. Add new templates here as the platform grows.
 *
 * Note: TeleSpeechBubble is NOT a template — it lives permanently in BaseLayout
 * and shows whatever the avatar is currently saying. Templates only render
 * interactive layers (options, forms, cards).
 */
export const TEMPLATE_REGISTRY: Record<string, React.LazyExoticComponent<AnyTemplate>> = {
  EmptyScreen: React.lazy(() =>
    import("@/components/templates/EmptyScreen").then((m) => ({
      default: m.EmptyScreen as unknown as AnyTemplate,
    }))
  ),
  WelcomeLanding: React.lazy(() =>
    import("@/components/templates/WelcomeLanding").then((m) => ({
      default: m.WelcomeLanding as unknown as AnyTemplate,
    }))
  ),
  GlassmorphicOptions: React.lazy(() =>
    import("@/components/templates/GlassmorphicOptions").then((m) => ({
      default: m.GlassmorphicOptions as unknown as AnyTemplate,
    }))
  ),
  MultiSelectOptions: React.lazy(() =>
    import("@/components/templates/MultiSelectOptions").then((m) => ({
      default: m.MultiSelectOptions as unknown as AnyTemplate,
    }))
  ),
  TextInput: React.lazy(() =>
    import("@/components/templates/TextInput").then((m) => ({
      default: m.TextInput as unknown as AnyTemplate,
    }))
  ),
  RegistrationForm: React.lazy(() =>
    import("@/components/templates/RegistrationForm").then((m) => ({
      default: m.RegistrationForm as unknown as AnyTemplate,
    }))
  ),
  LoadingGeneral: React.lazy(() =>
    import("@/components/templates/LoadingGeneral").then((m) => ({
      default: m.LoadingGeneral as unknown as AnyTemplate,
    }))
  ),
  LoadingLinkedIn: React.lazy(() =>
    import("@/components/templates/LoadingLinkedIn").then((m) => ({
      default: m.LoadingLinkedIn as unknown as AnyTemplate,
    }))
  ),
  CardStack: React.lazy(() =>
    import("@/components/templates/CardStack").then((m) => ({
      default: m.CardStack as unknown as AnyTemplate,
    }))
  ),
  Dashboard: React.lazy(() =>
    import("@/components/templates/Dashboard").then((m) => ({
      default: m.Dashboard as unknown as AnyTemplate,
    }))
  ),
  ProfileSheet: React.lazy(() =>
    import("@/components/templates/ProfileSheet").then((m) => ({
      default: m.ProfileSheet as unknown as AnyTemplate,
    }))
  ),
  CandidateSheet: React.lazy(() =>
    import("@/components/templates/CandidateSheet").then((m) => ({
      default: m.CandidateSheet as unknown as AnyTemplate,
    }))
  ),
};

/**
 * Required props for each template. DynamicSectionLoader validates these on
 * every render and sends [CORRECTION NEEDED] to the AI if any are missing.
 */
export const REQUIRED_PROPS: Record<string, string[]> = {
  EmptyScreen: [],
  WelcomeLanding: [],
  GlassmorphicOptions: ["bubbles"],
  MultiSelectOptions: ["bubbles"],
  TextInput: [],
  RegistrationForm: [],
  LoadingGeneral: [],
  LoadingLinkedIn: [],
  CardStack: [],
  Dashboard: [],
  ProfileSheet: ["name"],
  CandidateSheet: [],
};