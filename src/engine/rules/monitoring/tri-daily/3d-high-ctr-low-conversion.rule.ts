import { ICampaignBundle, ICampaignRuleDecision } from "src/engine/interfaces";
import BaseRule, { config } from "../../base.rule";
import { AdjustmentLog, EAction, ETarget, Adjustment } from "src/schemas/log.schema";

/**
 * RULE: 3-Day High CTR but Low Conversion (72 Hour)
 * Condition: CTR >3% but conversion rate <0.5% over 3 days
 * Action: Reduce bids 25%, indicates listing conversion issue
 * NOTE: Good traffic quality, poor product conversion
 */
export class ThreeDayHighCTRLowConversionRule extends BaseRule implements ICampaignRuleDecision {
  private minCtrThreshold: number = 3; // 3%
  private maxConversionRate: number = 0.5; // 0.5%
  private minImpressions: number = 500;

  constructor(bundle: ICampaignBundle) {
    super(bundle);
  }

  shouldApply(): boolean {
    if (!this.metrics) return false;

    const ctr = this.ctr;
    const conversionRate = this.cvr;

    return (
      this.impressions >= this.minImpressions &&
      ctr >= this.minCtrThreshold &&
      conversionRate <= this.maxConversionRate &&
      this.sales > 0
    );
  }

  execute(): AdjustmentLog {
    const ctr = this.ctr;
    const conversionRate = this.cvr;

    const adjustments: Adjustment[] = [
      { action: EAction.DECREASE_BID, change: -25, target: ETarget.TARGETING }
    ];

    return {
      ruleId: 'THREE_DAY_002',
      ruleName: '3-Day High CTR, Low Conversion - Listing Issue',
      campaignId: this.campaign.campaignId,
      adjustments,
      targetings: this.targets,
      reasoning:
        `Over 3 days: ${this.impressions} impressions, ${this.clicks} clicks (${ctr.toFixed(2)}% CTR - excellent!), ` +
        `but only ${this.metrics.purchase} orders (${conversionRate.toFixed(2)}% conversion - poor). ` +
        `Keywords and targeting are working, but product listing conversion is failing. ` +
        `Reducing bids 25% to minimize wasted spend while you improve reviews/pricing/images. ` +
        `Fix listing, then resume normal bids.`,
    };
  }
}
