import { CampaignTrigger } from "./types";
import DOMEvent from "../../util/DOMEvent";
import {
  TriggerCallback,
  setupFirstVisitTrigger,
  setupElementClickTrigger,
  setupElementHoverTrigger,
  setupIdleUserTrigger,
  setupPageLoadTrigger,
  setupScrollToElementTrigger,
  setupTimeOnPageTrigger,
  setupExitIntentTrigger,
  setupFormInteractionTrigger,
  setupCustomEventTrigger,
  setupUrlMatchTrigger,
  setupDeviceTypeTrigger,
  setupReturningUserTrigger,
  setupSessionCountTrigger,
  setupScrollDepthTrigger,
  setupElementVisibleTrigger,
} from "./triggers/index";

/**
 * Trigger detector class - handles all campaign trigger detection
 */
export class TriggerDetector {
  private triggers: Map<
    string,
    { trigger: CampaignTrigger; callback: TriggerCallback }[]
  > = new Map();
  private cleanupFunctions: Map<string, (() => void)[]> = new Map();
  private isInitialized = false;

  /**
   * Initialize the trigger detector
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    this.setupGlobalTriggers();
    this.isInitialized = true;
  }

  /**
   * Add a trigger for a campaign
   */
  async addTrigger(
    campaignId: string,
    trigger: CampaignTrigger,
    callback: TriggerCallback
  ): Promise<void> {
    if (!this.triggers.has(campaignId)) {
      this.triggers.set(campaignId, []);
      this.cleanupFunctions.set(campaignId, []);
    }

    this.triggers.get(campaignId)!.push({ trigger, callback });
    
    const cleanup = await this.setupTrigger(campaignId, trigger, callback);
    if (cleanup) {
      this.cleanupFunctions.get(campaignId)!.push(cleanup);
    }
  }

  /**
   * Remove all triggers for a campaign
   */
  removeCampaignTriggers(campaignId: string): void {
    const cleanups = this.cleanupFunctions.get(campaignId);
    if (cleanups) {
      cleanups.forEach((cleanup) => cleanup());
      this.cleanupFunctions.delete(campaignId);
    }
    this.triggers.delete(campaignId);
  }

  /**
   * Setup a specific trigger
   */
  private async setupTrigger(
    campaignId: string,
    trigger: CampaignTrigger,
    callback: TriggerCallback
  ): Promise<(() => void) | null> {
    switch (trigger.type) {
      case "first_visit":
        return setupFirstVisitTrigger(campaignId, trigger, callback);

      case "element_click":
        return setupElementClickTrigger(campaignId, trigger, callback);

      case "element_hover":
        return setupElementHoverTrigger(campaignId, trigger, callback);

      case "idle_user":
        return setupIdleUserTrigger(campaignId, trigger, callback);

      case "page_load":
        return setupPageLoadTrigger(campaignId, trigger, callback);

      case "scroll_to_element":
        return setupScrollToElementTrigger(campaignId, trigger, callback);

      case "time_on_page":
        return setupTimeOnPageTrigger(campaignId, trigger, callback);

      case "exit_intent":
        return setupExitIntentTrigger(campaignId, trigger, callback);

      case "form_interaction":
        return setupFormInteractionTrigger(campaignId, trigger, callback);

      case "custom_event":
        return setupCustomEventTrigger(campaignId, trigger, callback);

      case "url_match":
        return setupUrlMatchTrigger(campaignId, trigger, callback);

      case "device_type":
        return setupDeviceTypeTrigger(campaignId, trigger, callback);

      case "returning_user":
        return setupReturningUserTrigger(campaignId, trigger, callback);

      case "session_count":
        return setupSessionCountTrigger(campaignId, trigger, callback);

      case "scroll_depth":
        return setupScrollDepthTrigger(campaignId, trigger, callback);

      case "element_visible":
        return setupElementVisibleTrigger(campaignId, trigger, callback);

      default:
        return null;
    }
  }

  /**
   * Setup global triggers that don't need specific configuration
   */
  private setupGlobalTriggers(): void {
    // Page visibility change for idle detection
    DOMEvent.on(
      document,
      "visibilitychange" as any,
      () => {
        if (document.hidden) {
          this.pauseIdleTimers();
        } else {
          this.resumeIdleTimers();
        }
      },
      false
    );
  }

  /**
   * Pause idle timers when page is hidden
   */
  private pauseIdleTimers(): void {
    // Implementation for pausing idle timers
    // This would be used for idle user triggers
  }

  /**
   * Resume idle timers when page becomes visible
   */
  private resumeIdleTimers(): void {
    // Implementation for resuming idle timers
    // This would be used for idle user triggers
  }

  /**
   * Destroy the trigger detector
   */
  destroy(): void {
    // Clean up all campaign triggers
    this.triggers.forEach((_, campaignId) => {
      this.removeCampaignTriggers(campaignId);
    });

    this.triggers.clear();
    this.cleanupFunctions.clear();
    this.isInitialized = false;
  }
}
