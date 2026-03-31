/**
 * Speech-only no-op template.
 * Used when the AI wants to speak without showing any UI.
 */
export function EmptyScreen() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Intentionally empty - speech only */}
    </div>
  );
}