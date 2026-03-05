import { AutoCampaignAdjustment, ICampaignBundle, ICampaignRuleDecision, TargetingType } from "src/engine/interfaces";
import AutoCampaignBaseRule from "../../base.rule";
import { Type } from "src/schemas/campaign.schema";

/**
 * RULE 004: Top of Search Performing Better Than Rest
 * Indicators: Top of Search ACOS < Rest of Search ACOS, higher conversion at top
 * Action: Increase Top of Search placement multiplier 20%
 */
export class TopOfSearchPerformanceManualRule extends AutoCampaignBaseRule implements ICampaignRuleDecision {
  // private performanceGapThreshold: number;

  constructor(bundle: ICampaignBundle, performanceGapThreshold: number = 0.1) {
    super(bundle)
    // this.performanceGapThreshold = performanceGapThreshold;
  }

  // constructor(performanceGapThreshold: number = 0.1) {
  //   // this.performanceGapThreshold = performanceGapThreshold;
  // }

  shouldApply(): boolean {
    if (this.campaign.targetingType !== Type.MANUAL) return false;
    // if (!campaign.metrics7d) return false;

    // In real implementation, would have topOfSearchAcos and restOfSearchAcos from campaign
    // This is simplified - would need actual placement data
    const topOfSearchPerforming = false; // Placeholder

    return topOfSearchPerforming;
  }

  execute(): AutoCampaignAdjustment {
    return {
      ruleId: 'MANUAL_SCALE_004',
      ruleName: 'Increase Top of Search Placement',
      campaignId: this.campaign.campaignId,
      adjustments: {
        bidChanges: [
          { targetingType: TargetingType.TOP_OF_SEARCH, change: 20 },
        ],
        action: 'INCREASE',
      },
      reasoning:
        `Top of Search placement performing significantly better than Rest of Search. ` +
        `Increasing Top of Search placement bid multiplier by 20% to maintain premium visibility.`,
    };
  }
}