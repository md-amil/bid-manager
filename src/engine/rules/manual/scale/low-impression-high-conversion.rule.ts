import { AutoCampaignAdjustment,  ICampaignBundle, ICampaignRuleDecision, TargetingType } from "src/engine/interfaces";
import {  Type } from "src/schemas/campaign.schema";
import BaseRule, { config } from "../../base.rule";

/**
 * RULE 003: High Conversion but Low Impressions
 * Indicators: Good sales, low impressions, budget not fully utilized, ACOS acceptable
 * Action: Increase bids 15%, Keep budget same
 */
export class LowImpressionsHighConversionManualRule extends BaseRule implements ICampaignRuleDecision {
  // private impressionThreshold: number;
  // private budgetUtilizationThreshold: number;
  // private acosTarget: number;

  // constructor(impressionThreshold: number = 500, budgetUtilizationThreshold: number = 0.5, acosTarget: number = 0.30) {
  //   this.impressionThreshold = impressionThreshold;
  //   this.budgetUtilizationThreshold = budgetUtilizationThreshold;
  //   this.acosTarget = acosTarget;
  // }

  constructor(bundle: ICampaignBundle) {
    super(bundle);
  }

  shouldApply(): boolean {
    if (this.campaign.targetingType==Type.AUTO) return false;
    if (!this.metrics) return false;
    return (
      this.impressions < config.minImpressions &&
      this.utilization < config.budgetUtilizationThreshold &&
      this.acos <= config.targetAcos &&
      this.cvr > 2 && // 2%+ conversion
      this.sales > 0
    );
  }

  execute(): AutoCampaignAdjustment {
    // const conversionRate = (this.metrics.purchases7d / this.metrics.clicks * 100).toFixed(2);

    return {
      ruleId: 'MANUAL_SCALE_003',
      ruleName: 'Increase Bids - Low Impressions, High Conversion',
      campaignId: this.campaign.campaignId,
      adjustments: {
        bidChanges: [
          { targetingType: TargetingType.EXACT_MATCH, change: 15 },
          { targetingType: TargetingType.PHRASE_MATCH, change: 15 },
        ],
        action: 'INCREASE',
      },
      reasoning:
        `High conversion rate (${this.cvr}%) but low impressions (${this.impressions}). ` +
        `Budget utilization only ${(this.utilization* 100).toFixed(2)}%. ` +
        `Increasing bids 15% to unlock more impressions. Budget remains unchanged.`,
    };
  }
}