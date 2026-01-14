import {
  Campaign,
  CampaignTrigger,
  CampaignContext,
  CampaignCollection,
} from "./types";
import { TriggerDetector } from "./triggers";
import { UserTracker } from "./userTracker";
import { CampaignStorage } from "./storage";
import isFunction from "../../util/isFunction";
import {
  ExperienceFactory,
  CampaignExperience,
} from "./experienceFactory";

/**
 * Campaign Manager - Main class for managing and executing campaigns
 */
export class CampaignManager {
  private campaigns: Map<string, Campaign> = new Map();
  private triggerDetector: TriggerDetector;
  private userTracker: UserTracker;
  private storage: CampaignStorage;
  private activeExperiences: Map<string, CampaignExperience> = new Map();
  private isInitialized = false;

  constructor() {
    this.triggerDetector = new TriggerDetector();
    this.userTracker = new UserTracker();
    this.storage = new CampaignStorage();
  }

  /**
   * Initialize the campaign manager
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    await this.userTracker.initialize();
    await this.triggerDetector.initialize();

    this.isInitialized = true;
  }

  /**
   * Load campaigns from JSON configuration
   */
  async loadCampaigns(config: CampaignCollection | Campaign[]): Promise<void> {
    const campaigns = Array.isArray(config) ? config : config.campaigns;

    for (const campaign of campaigns) {
      if (campaign.active) {
        this.campaigns.set(campaign.id, campaign);
        await this.setupCampaignTriggers(campaign);
      }
    }
  }

  /**
   * Load campaigns from URL
   */
  async loadCampaignsFromUrl(url: string): Promise<void> {
    try {
      const response = await fetch(url);
      const config = await response.json();
      await this.loadCampaigns(config);
    } catch (error) {
      console.error("Failed to load campaigns from URL:", error);
    }
  }

  /**
   * Add a single campaign
   */
  async addCampaign(campaign: Campaign): Promise<void> {
    if (campaign.active) {
      this.campaigns.set(campaign.id, campaign);
      await this.setupCampaignTriggers(campaign);
    }
  }

  /**
   * Remove a campaign
   */
  removeCampaign(campaignId: string): void {
    const campaign = this.campaigns.get(campaignId);
    if (campaign) {
      this.triggerDetector.removeCampaignTriggers(campaignId);
      this.campaigns.delete(campaignId);

      // Stop active experience if running
      const activeExperience = this.activeExperiences.get(campaignId);
      if (activeExperience) {
        activeExperience.exit();
        this.activeExperiences.delete(campaignId);
      }
    }
  }

  /**
   * Get all active campaigns
   */
  getCampaigns(): Campaign[] {
    return Array.from(this.campaigns.values());
  }

  /**
   * Get a specific campaign
   */
  getCampaign(campaignId: string): Campaign | undefined {
    return this.campaigns.get(campaignId);
  }

  /**
   * Check if a campaign should be executed based on frequency and targeting
   */
  private async shouldExecuteCampaign(campaign: Campaign): Promise<boolean> {
    // Check frequency constraints
    if (campaign.frequency) {
      const canExecute = await this.storage.canExecuteCampaign(
        campaign.id,
        campaign.frequency
      );
      if (!canExecute) return false;
    }

    // Check targeting constraints
    if (campaign.targeting) {
      const matches = await this.checkTargeting(campaign.targeting);
      if (!matches) return false;
    }

    return true;
  }

  /**
   * Check if targeting conditions are met
   */
  private async checkTargeting(targeting: any): Promise<boolean> {
    const userContext = this.userTracker.getUserContext();

    // Check user agent
    if (targeting.userAgent) {
      const matches = targeting.userAgent.some((pattern: string) =>
        new RegExp(pattern).test(userContext.userAgent)
      );
      if (!matches) return false;
    }

    // Check language
    if (targeting.language) {
      if (!targeting.language.includes(userContext.language)) return false;
    }

    // Check referrer
    if (targeting.referrer) {
      const referrer = document.referrer;
      const matches = targeting.referrer.some((pattern: string) =>
        new RegExp(pattern).test(referrer)
      );
      if (!matches) return false;
    }

    // Check query parameters
    if (targeting.queryParams) {
      const urlParams = new URLSearchParams(window.location.search);
      for (const [key, value] of Object.entries(targeting.queryParams)) {
        if (urlParams.get(key) !== value) return false;
      }
    }

    // Check localStorage
    if (targeting.localStorage) {
      for (const [key, value] of Object.entries(targeting.localStorage)) {
        if (localStorage.getItem(key) !== value) return false;
      }
    }

    // Check sessionStorage
    if (targeting.sessionStorage) {
      for (const [key, value] of Object.entries(targeting.sessionStorage)) {
        if (sessionStorage.getItem(key) !== value) return false;
      }
    }

    // Check custom function
    if (targeting.customFunction) {
      const customFn = (window as any)[targeting.customFunction];
      if (isFunction(customFn)) {
        const result = await customFn(userContext);
        if (!result) return false;
      }
    }

    return true;
  }

  /**
   * Execute a campaign using the Experience Factory pattern
   * This method is decoupled from specific experience types (Tour, Hint, etc.)
   */
  async executeCampaign(
    campaignId: string,
    trigger: CampaignTrigger
  ): Promise<boolean> {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) return false;

    // Check if campaign should be executed
    if (!(await this.shouldExecuteCampaign(campaign))) {
      return false;
    }

    // Create campaign context
    const context: CampaignContext = {
      campaign,
      trigger,
      user: this.userTracker.getUserContext(),
      page: {
        url: window.location.href,
        referrer: document.referrer,
        title: document.title,
        loadTime: new Date(),
      },
    };

    // Track campaign execution
    await this.storage.trackCampaignExecution(campaignId);

    // Use the factory to create the appropriate experience type
    try {
      const experience = ExperienceFactory.createExperience(campaign);

      // Set up lifecycle callbacks
      experience.onComplete(() => {
        this.activeExperiences.delete(campaignId);
      });

      experience.onExit(() => {
        this.activeExperiences.delete(campaignId);
      });

      // Store active experience
      this.activeExperiences.set(campaignId, experience);

      // Start the experience
      await experience.start();
      return true;
    } catch (error) {
      console.error(`Failed to start campaign ${campaign.mode}:`, error);
      this.activeExperiences.delete(campaignId);
      return false;
    }
  }

  /**
   * Setup triggers for a campaign
   */
  private async setupCampaignTriggers(campaign: Campaign): Promise<void> {
    for (const trigger of campaign.triggers) {
      await this.triggerDetector.addTrigger(
        campaign.id,
        trigger,
        (triggeredCampaignId, triggeredTrigger) => {
          this.executeCampaign(triggeredCampaignId, triggeredTrigger);
        }
      );
    }
  }

  /**
   * Stop all active campaigns
   */
  async stopAllCampaigns(): Promise<void> {
    this.activeExperiences.forEach(async (experience) => {
      await experience.exit();
    });

    this.activeExperiences.clear();
  }

  /**
   * Destroy the campaign manager
   */
  destroy(): void {
    this.stopAllCampaigns();
    this.triggerDetector.destroy();
    this.campaigns.clear();
    this.isInitialized = false;
  }
}

// Global campaign manager instance
let globalCampaignManager: CampaignManager | null = null;

/**
 * Get or create the global campaign manager instance
 */
export function getCampaignManager(): CampaignManager {
  if (!globalCampaignManager) {
    globalCampaignManager = new CampaignManager();
  }
  return globalCampaignManager;
}

/**
 * Initialize campaigns from configuration
 */
export async function initializeCampaigns(
  config: CampaignCollection | Campaign[] | string
): Promise<CampaignManager> {
  const manager = getCampaignManager();
  await manager.initialize();

  if (typeof config === "string") {
    await manager.loadCampaignsFromUrl(config);
  } else {
    await manager.loadCampaigns(config);
  }

  return manager;
}
