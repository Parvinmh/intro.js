import { Campaign } from "./types";
import { Tour } from "../tour/tour";
import { Hint } from "../hint/hint";

/**
 * Base interface for all campaign experiences
 * This allows us to work with different experience types uniformly
 */
export interface CampaignExperience {
  /**
   * Start/launch the experience
   */
  start(): Promise<void>;

  /**
   * Exit/cleanup the experience
   */
  exit(): Promise<void>;

  /**
   * Set up lifecycle callbacks
   */
  onComplete(callback: () => void): void;
  onExit(callback: () => void): void;
}

/**
 * Adapter for Tour to implement CampaignExperience interface
 */
class TourExperienceAdapter implements CampaignExperience {
  private tour: Tour;

  constructor(tour: Tour) {
    this.tour = tour;
  }

  async start(): Promise<void> {
    await this.tour.start();
  }

  async exit(): Promise<void> {
    await this.tour.exit();
  }

  onComplete(callback: () => void): void {
    this.tour.onComplete(callback);
  }

  onExit(callback: () => void): void {
    this.tour.onExit(callback);
  }

  getTour(): Tour {
    return this.tour;
  }
}

/**
 * Adapter for Hint to implement CampaignExperience interface
 */
class HintExperienceAdapter implements CampaignExperience {
  private hint: Hint;

  constructor(hint: Hint) {
    this.hint = hint;
  }

  async start(): Promise<void> {
    await this.hint.render();
  }

  async exit(): Promise<void> {
    this.hint.destroy();
  }

  onComplete(callback: () => void): void {
    // Hints don't have a traditional "complete" callback
    // We can use onHintClose for all hints as a proxy
    this.hint.onHintClose(() => {
      const allHidden = this.hint
        .getHints()
        .every((h) => h.isActive && !h.isActive.val);
      if (allHidden) {
        callback();
      }
    });
  }

  onExit(callback: () => void): void {
    // For hints, we can consider exit as when all hints are destroyed
    // This is a simplified implementation
    this.hint.onHintClose(callback);
  }

  getHint(): Hint {
    return this.hint;
  }
}

/**
 * Experience Factory - Creates appropriate experience instances based on campaign configuration
 * This factory decouples campaign execution from specific experience types
 */
export class ExperienceFactory {
  /**
   * Create an experience based on the campaign configuration
   * @param campaign The campaign configuration
   * @returns A CampaignExperience instance
   * @throws Error if the experience type is not supported
   */
  static createExperience(campaign: Campaign): CampaignExperience {
    switch (campaign.mode) {
      case "tour":
        return this.createTourExperience(campaign);
      case "hint":
        return this.createHintExperience(campaign);
      default:
        throw new Error(
          `Unsupported experience type: ${campaign}. Supported types are: tour, hint`
        );
    }
  }

  /**
   * Create a Tour experience
   * @param campaign The campaign configuration
   */
  private static createTourExperience(campaign: Campaign): TourExperienceAdapter {
    if (campaign.mode !== "tour") {
      throw new Error("Campaign mode must be 'tour' for tour experience");
    }

    // Convert campaign steps to tour steps
    const steps = campaign.options.steps ?? [];

    const tourSteps = steps.map((step: any) => ({
      step: step.step,
      title: step.title,
      intro: step.intro,
      element: step.element,
      position: step.position,
      scrollTo: step.scrollTo,
      disableInteraction: step.disableInteraction,
      tooltipClass: step.tooltipClass,
    }));

    // Create and configure tour
    const tour = new Tour();
    tour.setOptions({
      ...campaign.options,
      steps: tourSteps,
    });

    return new TourExperienceAdapter(tour);
  }

  /**
   * Create a Hint experience
   * @param campaign The campaign configuration
   */
  private static createHintExperience(campaign: Campaign): HintExperienceAdapter {
    if (campaign.mode !== "hint") {
      throw new Error("Campaign mode must be 'hint' for hint experience");
    }

    // Create hint instance with options
    const hint = new Hint(undefined, campaign.options);

    return new HintExperienceAdapter(hint);
  }

  /**
   * Check if an experience type is supported
   * @param type The experience type to check
   */
  static isSupported(type: string): boolean {
    return ["tour", "hint"].includes(type);
  }

  /**
   * Get list of supported experience types
   */
  static getSupportedTypes(): string[] {
    return ["tour", "hint"];
  }
}
