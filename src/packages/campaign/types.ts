import { TourOptions } from "../tour/option";
import { HintOptions } from "../hint/option";

/**
 * Base trigger interface that all triggers must implement
 */
export interface BaseCampaignTrigger {
  type: string;
  delay?: number;              // Delay in milliseconds before triggering
  cookieName?: string;         // Custom cookie name for tracking
}

/**
 * First visit trigger - fires when user visits the page for the first time
 */
export interface FirstVisitTrigger extends BaseCampaignTrigger {
  type: "first_visit";
}

/**
 * Element click trigger - fires when user clicks on specific element
 */
export interface ElementClickTrigger extends BaseCampaignTrigger {
  type: "element_click";
  selector: string;            // CSS selector for the element
}

/**
 * Element hover trigger - fires when user hovers over specific element
 */
export interface ElementHoverTrigger extends BaseCampaignTrigger {
  type: "element_hover";
  selector: string;            // CSS selector for the element
  hoverDuration?: number;      // Minimum hover duration in ms
}

/**
 * Idle user trigger - fires when user is idle for specified time
 */
export interface IdleUserTrigger extends BaseCampaignTrigger {
  type: "idle_user";
  idleTime: number;            // Idle time threshold in milliseconds
}

/**
 * Page load trigger - fires when page finishes loading
 */
export interface PageLoadTrigger extends BaseCampaignTrigger {
  type: "page_load";
}

/**
 * Scroll to element trigger - fires when user scrolls to specific element
 */
export interface ScrollToElementTrigger extends BaseCampaignTrigger {
  type: "scroll_to_element";
  selector: string;            // CSS selector for the element
  threshold?: number;          // Visibility threshold (0-1), default 0.5
}

/**
 * Time on page trigger - fires after user spends specified time on page
 */
export interface TimeOnPageTrigger extends BaseCampaignTrigger {
  type: "time_on_page";
  duration: number;            // Duration in milliseconds
}

/**
 * Exit intent trigger - fires when user shows exit intent
 */
export interface ExitIntentTrigger extends BaseCampaignTrigger {
  type: "exit_intent";
  sensitivity?: number;        // Mouse movement sensitivity at top (pixels)
}

/**
 * Form interaction trigger - fires when user interacts with form elements
 */
export interface FormInteractionTrigger extends BaseCampaignTrigger {
  type: "form_interaction";
  selector?: string;           // Optional specific form selector
  interactionType?: "focus" | "input" | "change";
}

/**
 * Custom event trigger - fires on custom JavaScript event
 */
export interface CustomEventTrigger extends BaseCampaignTrigger {
  type: "custom_event";
  eventName: string;           // Name of the custom event to listen for
}

/**
 * URL match trigger - fires when URL matches pattern
 */
export interface UrlMatchTrigger extends BaseCampaignTrigger {
  type: "url_match";
  pattern: string;             // Regular expression pattern for URL matching
  matchType?: "exact" | "contains" | "regex";
}

/**
 * Device type trigger - fires for specific device type
 */
export interface DeviceTypeTrigger extends BaseCampaignTrigger {
  type: "device_type";
  device: "mobile" | "tablet" | "desktop";
}

/**
 * Returning user trigger - fires for users who have visited before
 */
export interface ReturningUserTrigger extends BaseCampaignTrigger {
  type: "returning_user";
  minVisits?: number;          // Minimum number of previous visits
}

/**
 * Session count trigger - fires based on session count
 */
export interface SessionCountTrigger extends BaseCampaignTrigger {
  type: "session_count";
  count: number;               // Session count threshold
  operator?: "equal" | "greater" | "less";
}

/**
 * Scroll depth trigger - fires when user scrolls to specific depth
 */
export interface ScrollDepthTrigger extends BaseCampaignTrigger {
  type: "scroll_depth";
  percentage: number;          // Scroll depth percentage (0-100)
}

/**
 * Element visible trigger - fires when specific element becomes visible
 */
export interface ElementVisibleTrigger extends BaseCampaignTrigger {
  type: "element_visible";
  selector: string;            // CSS selector for the element
  threshold?: number;          // Visibility threshold (0-1)
}

/**
 * Union type of all possible triggers
 */
export type CampaignTrigger =
  | FirstVisitTrigger
  | ElementClickTrigger
  | ElementHoverTrigger
  | IdleUserTrigger
  | PageLoadTrigger
  | ScrollToElementTrigger
  | TimeOnPageTrigger
  | ExitIntentTrigger
  | FormInteractionTrigger
  | CustomEventTrigger
  | UrlMatchTrigger
  | DeviceTypeTrigger
  | ReturningUserTrigger
  | SessionCountTrigger
  | ScrollDepthTrigger
  | ElementVisibleTrigger;

/**
 * Campaign frequency settings
 */
export interface CampaignFrequency {
  type: "once" | "daily" | "weekly" | "monthly" | "session" | "always";
  limit?: number;              // Maximum number of times to show
  cooldownMs?: number;         // Cooldown period in milliseconds
}

/**
 * Campaign targeting options
 */
export interface CampaignTargeting {
  userAgent?: string[];        // User agent patterns (regex)
  language?: string[];         // Browser languages (e.g., ["en", "en-US"])
  referrer?: string[];         // Referrer patterns (regex)
  queryParams?: Record<string, string>; // URL query parameters
  localStorage?: Record<string, string>; // Local storage key-value pairs
  sessionStorage?: Record<string, string>; // Session storage key-value pairs
  customFunction?: string;     // Custom targeting function name (global window function)
}

/**
 * Main campaign configuration
 */
export interface Campaign {
  id: string;                  // Unique campaign identifier
  name: string;                // Campaign name
  description?: string;        // Campaign description
  version?: string;            // Campaign version
  active: boolean;             // Whether campaign is active
  
  // Trigger configuration - can have multiple triggers (OR logic)
  triggers: CampaignTrigger[];
  
  // Tour or Hint mode
  mode: "tour" | "hint";
  
  // Tour configuration - uses existing TourOptions structure
  tourOptions?: Partial<TourOptions>;
  
  // Hint configuration - uses existing HintOptions structure
  hintOptions?: Partial<HintOptions>;
  
  // Frequency and targeting
  frequency?: CampaignFrequency;
  targeting?: CampaignTargeting;
  
  // Metadata
  createdAt?: string;
  updatedAt?: string;
  author?: string;
  tags?: string[];
  priority?: number;           // Priority for when multiple campaigns match (higher = higher priority)
}

/**
 * Campaign collection (multiple campaigns)
 */
export interface CampaignCollection {
  version: string;
  campaigns: Campaign[];
  global?: {
    targeting?: CampaignTargeting;
    tourDefaults?: Partial<TourOptions>;
    hintDefaults?: Partial<HintOptions>;
  };
}

/**
 * Campaign execution context
 */
export interface CampaignContext {
  campaign: Campaign;
  trigger: CampaignTrigger;
  user: {
    isFirstVisit: boolean;
    sessionCount: number;
    lastVisit?: Date;
    device: "mobile" | "tablet" | "desktop";
    language: string;
    userAgent: string;
  };
  page: {
    url: string;
    referrer: string;
    title: string;
    loadTime: Date;
  };
}

/**
 * Campaign execution status
 */
export interface CampaignExecutionStatus {
  campaignId: string;
  executed: boolean;
  timestamp: Date;
  trigger?: CampaignTrigger;
  completed?: boolean;
  skipped?: boolean;
  error?: string;
}

/**
 * Type guard functions for triggers
 */
export function isElementClickTrigger(trigger: CampaignTrigger): trigger is ElementClickTrigger {
  return trigger.type === "element_click";
}

export function isElementHoverTrigger(trigger: CampaignTrigger): trigger is ElementHoverTrigger {
  return trigger.type === "element_hover";
}

export function isScrollToElementTrigger(trigger: CampaignTrigger): trigger is ScrollToElementTrigger {
  return trigger.type === "scroll_to_element";
}

export function isIdleUserTrigger(trigger: CampaignTrigger): trigger is IdleUserTrigger {
  return trigger.type === "idle_user";
}

export function isTimeOnPageTrigger(trigger: CampaignTrigger): trigger is TimeOnPageTrigger {
  return trigger.type === "time_on_page";
}

export function isFormInteractionTrigger(trigger: CampaignTrigger): trigger is FormInteractionTrigger {
  return trigger.type === "form_interaction";
}

export function isCustomEventTrigger(trigger: CampaignTrigger): trigger is CustomEventTrigger {
  return trigger.type === "custom_event";
}

export function isUrlMatchTrigger(trigger: CampaignTrigger): trigger is UrlMatchTrigger {
  return trigger.type === "url_match";
}

export function isDeviceTypeTrigger(trigger: CampaignTrigger): trigger is DeviceTypeTrigger {
  return trigger.type === "device_type";
}

export function isSessionCountTrigger(trigger: CampaignTrigger): trigger is SessionCountTrigger {
  return trigger.type === "session_count";
}

export function isScrollDepthTrigger(trigger: CampaignTrigger): trigger is ScrollDepthTrigger {
  return trigger.type === "scroll_depth";
}

export function isElementVisibleTrigger(trigger: CampaignTrigger): trigger is ElementVisibleTrigger {
  return trigger.type === "element_visible";
}
