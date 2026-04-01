/**
 * Registered as window.__siteFunctions.navigateToSection (LiveKit callSiteFunction RPC).
 * Delegates to the live implementation installed by usePhaseFlow on
 * window.UIFrameworkSiteFunctions.navigateToSection once the talent UI is mounted.
 */

type NavigateImpl = (...args: unknown[]) => unknown;

export default function navigateToSection(args: unknown): ReturnType<NavigateImpl> {
  const impl = (
    window as unknown as { UIFrameworkSiteFunctions?: { navigateToSection?: NavigateImpl } }
  ).UIFrameworkSiteFunctions?.navigateToSection;

  if (typeof impl !== "function") {
    console.warn(
      "[navigateToSection] No implementation yet — talent session (usePhaseFlow) not mounted.",
    );
    return false;
  }

  return impl(args);
}
