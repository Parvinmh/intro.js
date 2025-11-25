import { CampaignFrequency } from "./types";

/**
 * Campaign storage - manages campaign execution history and frequency
 */
export class CampaignStorage {
  private storagePrefix = "introjs-campaign-";

  /**
   * Check if a campaign can be executed based on frequency settings
   */
  async canExecuteCampaign(
    campaignId: string,
    frequency: CampaignFrequency
  ): Promise<boolean> {
    const key = `${this.storagePrefix}${campaignId}`;
    const data = this.getExecutionData(key);

    // Check execution limit
    if (frequency.limit && data.count >= frequency.limit) {
      return false;
    }

    // Check frequency type
    switch (frequency.type) {
      case "once":
        return data.count === 0;

      case "session":
        return !sessionStorage.getItem(key);

      case "daily":
        return this.checkTimeWindow(data.lastExecution, 24 * 60 * 60 * 1000);

      case "weekly":
        return this.checkTimeWindow(
          data.lastExecution,
          7 * 24 * 60 * 60 * 1000
        );

      case "monthly":
        return this.checkTimeWindow(
          data.lastExecution,
          30 * 24 * 60 * 60 * 1000
        );

      case "always":
        // Check cooldown if specified
        if (frequency.cooldownMs) {
          return this.checkTimeWindow(data.lastExecution, frequency.cooldownMs);
        }
        return true;

      default:
        return true;
    }
  }

  /**
   * Track campaign execution
   */
  async trackCampaignExecution(campaignId: string): Promise<void> {
    const key = `${this.storagePrefix}${campaignId}`;
    const data = this.getExecutionData(key);

    data.count += 1;
    data.lastExecution = Date.now();

    localStorage.setItem(key, JSON.stringify(data));
    sessionStorage.setItem(key, "executed");
  }

  /**
   * Get execution data for a campaign
   */
  private getExecutionData(key: string): {
    count: number;
    lastExecution: number | null;
  } {
    const stored = localStorage.getItem(key);
    if (!stored) {
      return { count: 0, lastExecution: null };
    }

    try {
      return JSON.parse(stored);
    } catch {
      return { count: 0, lastExecution: null };
    }
  }

  /**
   * Check if enough time has passed since last execution
   */
  private checkTimeWindow(
    lastExecution: number | null,
    windowMs: number
  ): boolean {
    if (!lastExecution) return true;
    return Date.now() - lastExecution >= windowMs;
  }

  /**
   * Reset execution data for a campaign
   */
  resetCampaign(campaignId: string): void {
    const key = `${this.storagePrefix}${campaignId}`;
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  }

  /**
   * Reset all campaign data
   */
  resetAll(): void {
    // Clear localStorage items with campaign prefix
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.storagePrefix)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));

    // Clear sessionStorage items with campaign prefix
    const sessionKeysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith(this.storagePrefix)) {
        sessionKeysToRemove.push(key);
      }
    }
    sessionKeysToRemove.forEach((key) => sessionStorage.removeItem(key));
  }

  /**
   * Get execution statistics for a campaign
   */
  getStats(campaignId: string): { count: number; lastExecution: Date | null } {
    const key = `${this.storagePrefix}${campaignId}`;
    const data = this.getExecutionData(key);
    return {
      count: data.count,
      lastExecution: data.lastExecution ? new Date(data.lastExecution) : null,
    };
  }

  /**
   * Get all campaign statistics
   */
  getAllStats(): Record<string, { count: number; lastExecution: Date | null }> {
    const stats: Record<string, { count: number; lastExecution: Date | null }> =
      {};

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.storagePrefix)) {
        const campaignId = key.replace(this.storagePrefix, "");
        stats[campaignId] = this.getStats(campaignId);
      }
    }

    return stats;
  }
}
