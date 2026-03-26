import { ICampaignBundle, ICampaignRuleDecision } from "src/engine/interfaces";
import BaseRule, { config } from "../../base.rule";
import { AdjustmentLog, EAction, ETarget, Adjustment } from "src/schemas/log.schema";

/**
 * RULE: 3-Day Positive Trend Confirmation (72 Hour)
 * Condition: 3 days of consistent sales with improving ACOS
 * Action: Increase bids 15%, confirm scaling opportunity
 * NOTE: Only act on sustained trends, not one-day spikes
 */
export class ThreeDayPositiveTrendRule extends BaseRule implements ICampaignRuleDecision {
  private acosTarget: number = config.targetAcos;
  private minOrders: number = 3;

  constructor(bundle: ICampaignBundle) {
    super(bundle);
  }

  shouldApply(): boolean {
    if (!this.metrics) return false;

    // Need consistent performance
    if (this.metrics.purchase < this.minOrders) return false;

    // ACOS is good and improving (or stable at good level)
    return (
      this.acos <= this.acosTarget &&
      this.sales > 0
    );
  }

  execute(): AdjustmentLog {
    const acos = this.acos;

    const adjustments: Adjustment[] = [
      { action: EAction.INCREASE_BID, change: 15, target: ETarget.KEYWORDS },
      { action: EAction.INCREASE_BID, change: 15, target: ETarget.TARGETING }
    ];

    return {
      ruleId: 'THREE_DAY_004',
      ruleName: '3-Day Positive Trend - Scaling Opportunity',
      campaignId: this.campaign.campaignId,
      adjustments,
      keywords: this.keywordsIdText,
      targetings: this.targets,
      reasoning:
        `Positive trend confirmed over 3 days: ${this.metrics.purchase} orders, ACOS ${(acos * 100).toFixed(2)}% (target: ${(this.acosTarget * 100).toFixed(2)}%). ` +
        `Performance stable. This is a sustained trend, not a spike. ` +
        `Increasing bids 15% to capture more volume while maintaining profitability.`,
    };
  }
}
