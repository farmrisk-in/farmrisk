/**
 * Clear the user's "last irrigated on" selection (used to offset the soil
 * moisture water balance) and notify listeners (useIrrigation, SoilMoisture).
 *
 * The selection belongs to one place, so it must be cleared whenever the
 * location changes, and on sign-out.
 */
export function resetIrrigationSelection(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem("irrigation_days_before");
    sessionStorage.removeItem("irrigation_questions_answered");
  } catch {
    // Storage unavailable — listeners below still reset in-memory state.
  }
  window.dispatchEvent(
    new CustomEvent("farmrisk-irrigation-updated", { detail: undefined }),
  );
}
