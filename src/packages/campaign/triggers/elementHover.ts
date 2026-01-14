import { CampaignTrigger, isElementHoverTrigger } from "../types";
import { TriggerCallback, TriggerCleanup } from "./types";
import DOMEvent from "../../../util/DOMEvent";

/**
 * Setup element hover trigger
 */
export function setupElementHoverTrigger(
  campaignId: string,
  trigger: CampaignTrigger,
  callback: TriggerCallback
): TriggerCleanup {
  if (!isElementHoverTrigger(trigger)) {
    return () => {};
  }

  const handler = (event: Event) => {
    const target = event.target as Element;
    if (target.matches(trigger.selector)) {
      if (trigger.delay) {
        setTimeout(() => callback(campaignId, trigger), trigger.delay);
      } else {
        callback(campaignId, trigger);
      }
    }
  };

  DOMEvent.on(document, "mouseover" as any, handler, false);
  
  return () => {
    DOMEvent.off(document, "mouseover" as any, handler, false);
  };
}
