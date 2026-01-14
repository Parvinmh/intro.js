import { CampaignTrigger, isFormInteractionTrigger } from "../types";
import { TriggerCallback, TriggerCleanup } from "./types";
import DOMEvent from "../../../util/DOMEvent";

/**
 * Setup form interaction trigger
 */
export function setupFormInteractionTrigger(
  campaignId: string,
  trigger: CampaignTrigger,
  callback: TriggerCallback
): TriggerCleanup {
  if (!isFormInteractionTrigger(trigger)) {
    return () => {};
  }

  const selector =
    trigger.selector || "form input, form textarea, form select";

  const handler = (event: Event) => {
    const target = event.target as Element;
    if (target.matches(selector)) {
      callback(campaignId, trigger);
    }
  };

  DOMEvent.on(document, "focus" as any, handler, true);
  
  return () => {
    DOMEvent.off(document, "focus" as any, handler, true);
  };
}
