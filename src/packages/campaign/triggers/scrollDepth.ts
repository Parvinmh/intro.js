import { CampaignTrigger, isScrollDepthTrigger } from "../types";
import { TriggerCallback, TriggerCleanup } from "./types";
import DOMEvent from "../../../util/DOMEvent";

/**
 * Setup scroll depth trigger
 */
export function setupScrollDepthTrigger(
  campaignId: string,
  trigger: CampaignTrigger,
  callback: TriggerCallback
): TriggerCleanup {
  if (!isScrollDepthTrigger(trigger)) {
    return () => {};
  }

  const handler = () => {
    const scrollPercent =
      (window.scrollY /
        (document.documentElement.scrollHeight - window.innerHeight)) *
      100;

    if (scrollPercent >= trigger.percentage) {
      callback(campaignId, trigger);
      DOMEvent.off(window, "scroll", handler, false);
    }
  };

  DOMEvent.on(window, "scroll", handler, false);
  
  return () => {
    DOMEvent.off(window, "scroll", handler, false);
  };
}
