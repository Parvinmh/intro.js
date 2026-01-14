import { CampaignTrigger } from "../types";

/**
 * Trigger callback function type
 */
export type TriggerCallback = (
  campaignId: string,
  trigger: CampaignTrigger
) => void;

/**
 * Trigger setup function type
 */
export type TriggerSetup = {
  setup: (
    campaignId: string,
    trigger: CampaignTrigger,
    callback: TriggerCallback
  ) => TriggerCleanup;
};

/**
 * Trigger cleanup function type
 */
export type TriggerCleanup = () => void;
