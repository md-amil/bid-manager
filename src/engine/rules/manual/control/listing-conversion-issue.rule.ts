import { AutoCampaignAdjustment, ICampaignBundle, ICampaignRuleDecision, TargetingType } from "src/engine/interfaces";
import { Type } from "src/schemas/campaign.schema";
import BaseRule, { config } from "../../base.rule";
import { AdjustmentLog, EAction, ETarget } from "src/schemas/log.schema";

/**
 * RULE 005: Listing Conversion Issue
 * Indicators: Good impressions, good clicks, poor sales, poor reviews/high price/weak images
 * Action: Reduce bids 50%, Do not increase budget, Fix listing first
 */
export class ListingConversionIssueManualRule extends BaseRule implements ICampaignRuleDecision {
  // private impressionThreshold: number = 500;
  // private expectedConversionRate: number = 0.03;

  constructor(bundle: ICampaignBundle) {
    super(bundle)
  }

  shouldApply(): boolean {
    if (this.campaign.targetingType !== Type.MANUAL) return false;
    if (!this.metrics) return false;
    const expectedSales = this.clicks * config.expectedConversionRate;
    return (
      this.impressions >= config.minImpressions &&
      this.clicks > config.minClicks &&
      this.cvr < config.expectedConversionRate * 0.5 && // 50% or lower than expected
      this.sales < expectedSales
    );
  }

  execute(): AdjustmentLog {
    // const metrics = campaign.metrics7d!;
    // const conversionRate = (metrics.orders / metrics.clicks * 100).toFixed(2);
    const conversionRate = this.cvr.toFixed(2);

    return {
      ruleId: 'MANUAL_CONTROL_005',
      ruleName: 'Reduce Bids - Listing Conversion Issue',
      campaignName: this.campaign.name,
      campaignId: this.campaign.campaignId,
      adjustments: [
        // {
        //   action: EAction.DECREASE_BID,
        //   change: -50,
        //   target: ETarget.TARGETING,
        // },
        {
          action: EAction.DECREASE_BID,
          change: -50,
          target: ETarget.KEYWORDS,
        }
      ],
      keywords:this.keywordsIdText,
      reasoning:
        `Good traffic (${this.impressions} impressions, ${this.clicks} clicks) but poor conversion (${conversionRate}%). ` +
        `This indicates listing issue (poor reviews, pricing, or images), NOT keyword issue. ` +
        `Reducing bids 50% to minimize wasted spend. Budget remains unchanged. Fix listing first.`,
    };
  }
}