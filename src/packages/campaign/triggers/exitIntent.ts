import { CampaignTrigger } from "../types";
import { TriggerCallback, TriggerCleanup } from "./types";
import DOMEvent from "../../../util/DOMEvent";

/**
 * Setup exit intent trigger
 */
export function setupExitIntentTrigger(
  campaignId: string,
  trigger: CampaignTrigger,
  callback: TriggerCallback
): TriggerCleanup {
  let hasTriggered = false;

  const handler = (event: MouseEvent) => {
    if (hasTriggered) return;

    if (event.clientY <= 0) {
      hasTriggered = true;
      callback(campaignId, trigger);
    }
  };

  DOMEvent.on(document, "mouseleave" as any, handler, false);
  
  return () => {
    DOMEvent.off(document, "mouseleave" as any, handler, false);
  };
}
