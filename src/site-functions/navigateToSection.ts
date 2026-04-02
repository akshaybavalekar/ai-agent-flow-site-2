/**
 * Registered as window.__siteFunctions.navigateToSection (LiveKit callSiteFunction RPC).
 * Delegates to the live implementation installed by usePhaseFlow on
 * window.UIFrameworkSiteFunctions.navigateToSection once the talent UI is mounted.
 */

type NavigateImpl = (...args: unknown[]) => unknown;

export default function navigateToSection(args: unknown): ReturnType<NavigateImpl> {
  console.log("[navigateToSection WRAPPER] Called with args:", args);
  console.log("[navigateToSection WRAPPER] Args type:", typeof args);
  console.log("[navigateToSection WRAPPER] Args stringified:", JSON.stringify(args, null, 2));
  
  const impl = (
    window as unknown as { UIFrameworkSiteFunctions?: { navigateToSection?: NavigateImpl } }
  ).UIFrameworkSiteFunctions?.navigateToSection;

  if (typeof impl !== "function") {
    console.warn(
      "[navigateToSection] No implementation yet — talent session (usePhaseFlow) not mounted.",
    );
    return false;
  }

  console.log("[navigateToSection WRAPPER] Implementation found, calling it now...");
  const result = impl(args);
  console.log("[navigateToSection WRAPPER] Implementation returned:", result);
  
  return result;
}
