/**
 * Registered as window.__siteFunctions.navigateToSection (LiveKit callSiteFunction RPC).
 * Delegates to the live implementation installed by usePhaseFlow on
 * window.UIFrameworkSiteFunctions.navigateToSection once the talent UI is mounted.
 *
 * If the implementation is not yet installed (race condition: GPT-4o-mini responds before
 * React finishes mounting TalentApp and running usePhaseFlow's useEffect), the call is
 * buffered and replayed within ~50ms once the real implementation is available.
 */

type NavigateImpl = (...args: unknown[]) => unknown;

let _pendingCall: unknown | null = null;
let _pollTimer: ReturnType<typeof setInterval> | null = null;

function getLiveImpl(): NavigateImpl | undefined {
  return (
    window as unknown as { UIFrameworkSiteFunctions?: { navigateToSection?: NavigateImpl } }
  ).UIFrameworkSiteFunctions?.navigateToSection;
}

export default function navigateToSection(args: unknown): ReturnType<NavigateImpl> {
  console.log("[navigateToSection WRAPPER] Called with args:", args);
  console.log("[navigateToSection WRAPPER] Args type:", typeof args);
  console.log("[navigateToSection WRAPPER] Args stringified:", JSON.stringify(args, null, 2));

  const impl = getLiveImpl();

  if (typeof impl !== "function") {
    console.warn(
      "[navigateToSection] No implementation yet — buffering call until usePhaseFlow mounts.",
    );

    // Keep only the latest call — each new navigateToSection supersedes the previous
    _pendingCall = args;

    if (!_pollTimer) {
      _pollTimer = setInterval(() => {
        const liveImpl = getLiveImpl();
        if (typeof liveImpl === "function" && _pendingCall !== null) {
          clearInterval(_pollTimer!);
          _pollTimer = null;
          const buffered = _pendingCall;
          _pendingCall = null;
          console.log("[navigateToSection WRAPPER] Replaying buffered call now.");
          liveImpl(buffered);
        }
      }, 50);
    }

    return false;
  }

  // Implementation is live — cancel any pending buffer and call directly
  if (_pollTimer) {
    clearInterval(_pollTimer);
    _pollTimer = null;
  }
  _pendingCall = null;

  console.log("[navigateToSection WRAPPER] Implementation found, calling it now...");
  const result = impl(args);
  console.log("[navigateToSection WRAPPER] Implementation returned:", result);
  return result;
}
