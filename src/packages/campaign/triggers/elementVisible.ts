import { CampaignTrigger, isElementVisibleTrigger } from "../types";
import { TriggerCallback, TriggerCleanup } from "./types";
import DOMEvent from "../../../util/DOMEvent";

/**
 * Setup element visible trigger
 */
export function setupElementVisibleTrigger(
  campaignId: string,
  trigger: CampaignTrigger,
  callback: TriggerCallback
): TriggerCleanup {
  if (!isElementVisibleTrigger(trigger)) {
    return () => {};
  }

  const checkVisibility = () => {
    const element = document.querySelector(trigger.selector);
    if (element) {
      const rect = element.getBoundingClientRect();
      const threshold = trigger.threshold || 0.5;
      const elementHeight = rect.height;
      const visibleHeight =
        Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);
      const visibilityRatio = visibleHeight / elementHeight;

      if (visibilityRatio >= threshold) {
        callback(campaignId, trigger);
        DOMEvent.off(window, "scroll", handler, false);
        DOMEvent.off(window, "resize" as any, handler, false);
      }
    }
  };

  const handler = () => checkVisibility();

  // Check on setup
  checkVisibility();

  // Listen for scroll and resize
  DOMEvent.on(window, "scroll", handler, false);
  DOMEvent.on(window, "resize" as any, handler, false);

  return () => {
    DOMEvent.off(window, "scroll", handler, false);
    DOMEvent.off(window, "resize" as any, handler, false);
  };
}
