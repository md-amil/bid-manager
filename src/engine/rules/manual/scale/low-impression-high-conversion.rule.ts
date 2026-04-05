import { ICampaignBundle, ICampaignRuleDecision } from "src/engine/interfaces";
import {  Type } from "src/schemas/campaign.schema";
import BaseRule, { config } from "../../base.rule";
import { AdjustmentLog, EAction, ETarget } from "src/schemas/log.schema";

/**
 * RULE 003: High Conversion but Low Impressions
 * Indicators: Good sales, low impressions, budget not fully utilized, ACOS acceptable
 * Action: Increase bids 15%, Keep budget same
 */

export class LowImpressionsHighConversionManualRule extends BaseRule implements ICampaignRuleDecision {
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

  execute(): AdjustmentLog {

    return {
      ruleId: 'MANUAL_SCALE_003',
      ruleName: 'Increase Bids - Low Impressions, High Conversion',
      campaignId: this.campaign.campaignId,
      campaignName: this.campaign.name,
      adjustments:[
        {
          action:EAction.INCREASE_BID,
          change: 15,
          target:ETarget.KEYWORDS
        }
      ],
      keywords:this.keywordsIdText,
      reasoning:
        `High conversion rate ( ${this.cvr} % ) but low impressions (${this.impressions}). ` +
        `Budget utilization only ${(this.utilization* 100).toFixed(2)}%. ` +
        `Increasing bids 15% to unlock more impressions. Budget remains unchanged.`,
    };
  }
}