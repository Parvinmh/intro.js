import {
  CampaignTrigger,
  isElementClickTrigger,
  isElementHoverTrigger,
  isIdleUserTrigger,
  isScrollToElementTrigger,
  isTimeOnPageTrigger,
  isFormInteractionTrigger,
  isCustomEventTrigger,
  isUrlMatchTrigger,
  isDeviceTypeTrigger,
  isSessionCountTrigger,
  isScrollDepthTrigger,
  isElementVisibleTrigger,
} from "./types";
import DOMEvent from "../../util/DOMEvent";

/**
 * Trigger callback function type
 */
export type TriggerCallback = (
  campaignId: string,
  trigger: CampaignTrigger
) => void;

/**
 * Trigger detector class - handles all campaign trigger detection
 */
export class TriggerDetector {
  private triggers: Map<
    string,
    { trigger: CampaignTrigger; callback: TriggerCallback }[]
  > = new Map();
  private eventListeners: Map<string, () => void> = new Map();
  private timers: Map<string, number> = new Map();
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
    }

    this.triggers.get(campaignId)!.push({ trigger, callback });
    await this.setupTrigger(campaignId, trigger, callback);
  }

  /**
   * Remove all triggers for a campaign
   */
  removeCampaignTriggers(campaignId: string): void {
    const campaignTriggers = this.triggers.get(campaignId);
    if (campaignTriggers) {
      campaignTriggers.forEach(({ trigger }) => {
        this.cleanupTrigger(campaignId, trigger);
      });
      this.triggers.delete(campaignId);
    }
  }

  /**
   * Setup a specific trigger
   */
  private async setupTrigger(
    campaignId: string,
    trigger: CampaignTrigger,
    callback: TriggerCallback
  ): Promise<void> {
    switch (trigger.type) {
      case "first_visit":
        this.setupFirstVisitTrigger(campaignId, trigger, callback);
        break;

      case "element_click":
        if (isElementClickTrigger(trigger)) {
          this.setupElementClickTrigger(campaignId, trigger, callback);
        }
        break;

      case "element_hover":
        if (isElementHoverTrigger(trigger)) {
          this.setupElementHoverTrigger(campaignId, trigger, callback);
        }
        break;

      case "idle_user":
        if (isIdleUserTrigger(trigger)) {
          this.setupIdleUserTrigger(campaignId, trigger, callback);
        }
        break;

      case "page_load":
        this.setupPageLoadTrigger(campaignId, trigger, callback);
        break;

      case "scroll_to_element":
        if (isScrollToElementTrigger(trigger)) {
          this.setupScrollToElementTrigger(campaignId, trigger, callback);
        }
        break;

      case "time_on_page":
        if (isTimeOnPageTrigger(trigger)) {
          this.setupTimeOnPageTrigger(campaignId, trigger, callback);
        }
        break;

      case "exit_intent":
        this.setupExitIntentTrigger(campaignId, trigger, callback);
        break;

      case "form_interaction":
        if (isFormInteractionTrigger(trigger)) {
          this.setupFormInteractionTrigger(campaignId, trigger, callback);
        }
        break;

      case "custom_event":
        if (isCustomEventTrigger(trigger)) {
          this.setupCustomEventTrigger(campaignId, trigger, callback);
        }
        break;

      case "url_match":
        if (isUrlMatchTrigger(trigger)) {
          this.setupUrlMatchTrigger(campaignId, trigger, callback);
        }
        break;

      case "device_type":
        if (isDeviceTypeTrigger(trigger)) {
          this.setupDeviceTypeTrigger(campaignId, trigger, callback);
        }
        break;

      case "returning_user":
        this.setupReturningUserTrigger(campaignId, trigger, callback);
        break;

      case "session_count":
        if (isSessionCountTrigger(trigger)) {
          this.setupSessionCountTrigger(campaignId, trigger, callback);
        }
        break;

      case "scroll_depth":
        if (isScrollDepthTrigger(trigger)) {
          this.setupScrollDepthTrigger(campaignId, trigger, callback);
        }
        break;

      case "element_visible":
        if (isElementVisibleTrigger(trigger)) {
          this.setupElementVisibleTrigger(campaignId, trigger, callback);
        }
        break;
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
   * Setup first visit trigger
   */
  private setupFirstVisitTrigger(
    campaignId: string,
    trigger: CampaignTrigger,
    callback: TriggerCallback
  ): void {
    const cookieName =
      trigger.cookieName || `introjs-first-visit-${campaignId}`;
    const hasVisited = localStorage.getItem(cookieName);

    if (!hasVisited) {
      localStorage.setItem(cookieName, Date.now().toString());

      if (trigger.delay) {
        setTimeout(() => callback(campaignId, trigger), trigger.delay);
      } else {
        callback(campaignId, trigger);
      }
    }
  }

  /**
   * Setup element click trigger
   */
  private setupElementClickTrigger(
    campaignId: string,
    trigger: CampaignTrigger & { selector: string },
    callback: TriggerCallback
  ): void {
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

    DOMEvent.on(document, "click", handler, false);
    this.eventListeners.set(`${campaignId}-click`, () => {
      DOMEvent.off(document, "click", handler, false);
    });
  }

  /**
   * Setup element hover trigger
   */
  private setupElementHoverTrigger(
    campaignId: string,
    trigger: CampaignTrigger & { selector: string },
    callback: TriggerCallback
  ): void {
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
    this.eventListeners.set(`${campaignId}-hover`, () => {
      DOMEvent.off(document, "mouseover" as any, handler, false);
    });
  }

  /**
   * Setup idle user trigger
   */
  private setupIdleUserTrigger(
    campaignId: string,
    trigger: CampaignTrigger & { idleTime: number },
    callback: TriggerCallback
  ): void {
    const idleTime = trigger.idleTime;
    let idleTimer: number;
    let isIdle = false;

    const resetTimer = () => {
      if (isIdle) return;

      clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => {
        isIdle = true;
        callback(campaignId, trigger);
      }, idleTime);
    };

    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
    ];
    const handlers = events.map((event) => {
      const handler = resetTimer;
      DOMEvent.on(document, event as any, handler, true);
      return () => DOMEvent.off(document, event as any, handler, true);
    });

    resetTimer(); // Start the timer

    this.eventListeners.set(`${campaignId}-idle`, () => {
      clearTimeout(idleTimer);
      handlers.forEach((cleanup) => cleanup());
    });
  }

  /**
   * Setup page load trigger
   */
  private setupPageLoadTrigger(
    campaignId: string,
    trigger: CampaignTrigger,
    callback: TriggerCallback
  ): void {
    if (document.readyState === "complete") {
      if (trigger.delay) {
        setTimeout(() => callback(campaignId, trigger), trigger.delay);
      } else {
        callback(campaignId, trigger);
      }
    } else {
      const handler = () => {
        if (trigger.delay) {
          setTimeout(() => callback(campaignId, trigger), trigger.delay);
        } else {
          callback(campaignId, trigger);
        }
      };

      DOMEvent.on(window, "load" as any, handler, false);
      this.eventListeners.set(`${campaignId}-load`, () => {
        DOMEvent.off(window, "load" as any, handler, false);
      });
    }
  }

  /**
   * Setup scroll to element trigger
   */
  private setupScrollToElementTrigger(
    campaignId: string,
    trigger: CampaignTrigger & { selector: string; threshold?: number },
    callback: TriggerCallback
  ): void {
    const handler = () => {
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
        }
      }
    };

    DOMEvent.on(window, "scroll", handler, false);
    this.eventListeners.set(`${campaignId}-scroll`, () => {
      DOMEvent.off(window, "scroll", handler, false);
    });
  }

  /**
   * Setup time on page trigger
   */
  private setupTimeOnPageTrigger(
    campaignId: string,
    trigger: CampaignTrigger & { duration: number },
    callback: TriggerCallback
  ): void {
    const timer = window.setTimeout(() => {
      callback(campaignId, trigger);
    }, trigger.duration);

    this.timers.set(`${campaignId}-time`, timer);
  }

  /**
   * Setup exit intent trigger
   */
  private setupExitIntentTrigger(
    campaignId: string,
    trigger: CampaignTrigger,
    callback: TriggerCallback
  ): void {
    let hasTriggered = false;

    const handler = (event: MouseEvent) => {
      if (hasTriggered) return;

      if (event.clientY <= 0) {
        hasTriggered = true;
        callback(campaignId, trigger);
      }
    };

    DOMEvent.on(document, "mouseleave" as any, handler, false);
    this.eventListeners.set(`${campaignId}-exit`, () => {
      DOMEvent.off(document, "mouseleave" as any, handler, false);
    });
  }

  /**
   * Setup form interaction trigger
   */
  private setupFormInteractionTrigger(
    campaignId: string,
    trigger: CampaignTrigger & { selector?: string },
    callback: TriggerCallback
  ): void {
    const selector =
      trigger.selector || "form input, form textarea, form select";

    const handler = (event: Event) => {
      const target = event.target as Element;
      if (target.matches(selector)) {
        callback(campaignId, trigger);
      }
    };

    DOMEvent.on(document, "focus" as any, handler, true);
    this.eventListeners.set(`${campaignId}-form`, () => {
      DOMEvent.off(document, "focus" as any, handler, true);
    });
  }

  /**
   * Setup custom event trigger
   */
  private setupCustomEventTrigger(
    campaignId: string,
    trigger: CampaignTrigger & { eventName: string },
    callback: TriggerCallback
  ): void {
    const handler = () => {
      callback(campaignId, trigger);
    };

    DOMEvent.on(document, trigger.eventName as any, handler, false);
    this.eventListeners.set(`${campaignId}-custom`, () => {
      DOMEvent.off(document, trigger.eventName as any, handler, false);
    });
  }

  /**
   * Setup URL match trigger
   */
  private setupUrlMatchTrigger(
    campaignId: string,
    trigger: CampaignTrigger & { pattern: string; matchType?: string },
    callback: TriggerCallback
  ): void {
    const currentUrl = window.location.href;
    let matches = false;

    switch (trigger.matchType) {
      case "exact":
        matches = currentUrl === trigger.pattern;
        break;
      case "contains":
        matches = currentUrl.includes(trigger.pattern);
        break;
      case "regex":
      default:
        matches = new RegExp(trigger.pattern).test(currentUrl);
        break;
    }

    if (matches) {
      if (trigger.delay) {
        setTimeout(() => callback(campaignId, trigger), trigger.delay);
      } else {
        callback(campaignId, trigger);
      }
    }
  }

  /**
   * Setup device type trigger
   */
  private setupDeviceTypeTrigger(
    campaignId: string,
    trigger: CampaignTrigger & { device: string },
    callback: TriggerCallback
  ): void {
    const currentDevice = this.detectDeviceType();

    if (currentDevice === trigger.device) {
      if (trigger.delay) {
        setTimeout(() => callback(campaignId, trigger), trigger.delay);
      } else {
        callback(campaignId, trigger);
      }
    }
  }

  /**
   * Setup returning user trigger
   */
  private setupReturningUserTrigger(
    campaignId: string,
    trigger: CampaignTrigger,
    callback: TriggerCallback
  ): void {
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
  }

  /**
   * Setup session count trigger
   */
  private setupSessionCountTrigger(
    campaignId: string,
    trigger: CampaignTrigger & { count: number; operator?: string },
    callback: TriggerCallback
  ): void {
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
  }

  /**
   * Setup scroll depth trigger
   */
  private setupScrollDepthTrigger(
    campaignId: string,
    trigger: CampaignTrigger & { percentage: number },
    callback: TriggerCallback
  ): void {
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
    this.eventListeners.set(`${campaignId}-scroll-depth`, () => {
      DOMEvent.off(window, "scroll", handler, false);
    });
  }

  /**
   * Setup element visible trigger
   */
  private setupElementVisibleTrigger(
    campaignId: string,
    trigger: CampaignTrigger & { selector: string; threshold?: number },
    callback: TriggerCallback
  ): void {
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

    this.eventListeners.set(`${campaignId}-element-visible`, () => {
      DOMEvent.off(window, "scroll", handler, false);
      DOMEvent.off(window, "resize" as any, handler, false);
    });
  }

  /**
   * Detect device type based on screen size and user agent
   */
  private detectDeviceType(): "mobile" | "tablet" | "desktop" {
    const width = window.innerWidth;
    const userAgent = navigator.userAgent.toLowerCase();

    if (
      width <= 768 ||
      /mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(
        userAgent
      )
    ) {
      return "mobile";
    } else if (width <= 1024 || /tablet|ipad/i.test(userAgent)) {
      return "tablet";
    } else {
      return "desktop";
    }
  }

  /**
   * Pause idle timers when page is hidden
   */
  private pauseIdleTimers(): void {
    // Implementation for pausing idle timers
  }

  /**
   * Resume idle timers when page becomes visible
   */
  private resumeIdleTimers(): void {
    // Implementation for resuming idle timers
  }

  /**
   * Clean up a specific trigger
   */
  private cleanupTrigger(campaignId: string, trigger: CampaignTrigger): void {
    const triggerKey = `${campaignId}-${trigger.type}`;

    // Clean up event listeners
    const cleanup = this.eventListeners.get(triggerKey);
    if (cleanup) {
      cleanup();
      this.eventListeners.delete(triggerKey);
    }

    // Clean up timers
    const timer = this.timers.get(triggerKey);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(triggerKey);
    }
  }

  /**
   * Destroy the trigger detector
   */
  destroy(): void {
    // Clean up all event listeners
    this.eventListeners.forEach((cleanup) => cleanup());
    this.eventListeners.clear();

    // Clean up all timers
    this.timers.forEach((timer) => clearTimeout(timer));
    this.timers.clear();

    this.triggers.clear();
    this.isInitialized = false;
  }
}
