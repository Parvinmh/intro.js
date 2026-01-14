import { CampaignTrigger, isSessionCountTrigger } from "../types";
import { TriggerCallback, TriggerCleanup } from "./types";

/**
 * Setup session count trigger
 */
export function setupSessionCountTrigger(
  campaignId: string,
  trigger: CampaignTrigger,
  callback: TriggerCallback
): TriggerCleanup {
  if (!isSessionCountTrigger(trigger)) {
    return () => {};
  }

  const cookieName = trigger.cookieName || "introjs-session-count";
  const sessionCount =
    parseInt(localStorage.getItem(cookieName) || "0", 10) + 1;

  localStorage.setItem(cookieName, sessionCount.toString());

  let shouldTrigger = false;
  switch (trigger.operator) {
    case "equal":
      shouldTrigger = sessionCount === trigger.count;
      break;
    case "greater":
      shouldTrigger = sessionCount > trigger.count;
      break;
    case "less":
      shouldTrigger = sessionCount < trigger.count;
      break;
    default:
      shouldTrigger = sessionCount >= trigger.count;
      break;
  }

  if (shouldTrigger) {
    if (trigger.delay) {
      setTimeout(() => callback(campaignId, trigger), trigger.delay);
    } else {
      callback(campaignId, trigger);
    }
  }

  // No cleanup needed for session count trigger
  return () => {};
}
