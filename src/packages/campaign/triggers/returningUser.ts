import { CampaignTrigger } from "../types";
import { TriggerCallback, TriggerCleanup } from "./types";

/**
 * Setup returning user trigger
 */
export function setupReturningUserTrigger(
  campaignId: string,
  trigger: CampaignTrigger,
  callback: TriggerCallback
): TriggerCleanup {
  const cookieName = trigger.cookieName || "introjs-returning-user";
  const hasVisited = localStorage.getItem(cookieName);

  if (hasVisited) {
    if (trigger.delay) {
      setTimeout(() => callback(campaignId, trigger), trigger.delay);
    } else {
      callback(campaignId, trigger);
    }
  } else {
    localStorage.setItem(cookieName, Date.now().toString());
  }

  // No cleanup needed for returning user trigger
  return () => {};
}
