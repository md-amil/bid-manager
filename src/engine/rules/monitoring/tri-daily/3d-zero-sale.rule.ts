import { ICampaignBundle, ICampaignRuleDecision } from "src/engine/interfaces";
import BaseRule, { config } from "../../base.rule";
import { AdjustmentLog, EAction, ETarget, Adjustment } from "src/schemas/log.schema";

/**
 * RULE: 3-Day Continuous Spend Without Sales (72 Hour)
 * Condition: 3 days of increasing spend with zero total sales
 * Action: Reduce bids 25%, add negatives, monitor for 7 days
 * NOTE: Confirms spending is the problem, not a one-day anomaly
 */
export class ThreeDayZeroSalesRule extends BaseRule implements ICampaignRuleDecision {
  private minSpendThresholdValue: number = 150;
  private minClicks: number = 30;

  constructor(bundle: ICampaignBundle) {
    super(bundle);
  }

  shouldApply(): boolean {
    if (!this.metrics) return false;
    // Check: significant spend over 3 days, but zero sales
    return (
      this.cost >= this.minSpendThresholdValue &&
      this.sales === 0 &&
      this.clicks >= this.minClicks
    );
  }

  execute(): AdjustmentLog {
    const avgDailySpend = this.cost / 3;

    const zeroSaleTerms = this.searchTerms.filter(st =>
      st.clicks >= 10 && st.sales7d === 0
    );

    const adjustments: Adjustment[] = [
      { action: EAction.DECREASE_BID, change: -25, target: ETarget.TARGETING },
      { action: EAction.ADD_NEGATIVE, target: ETarget.TERMS }
    ];

    return {
      ruleId: 'THREE_DAY_001',
      ruleName: '3-Day Zero Sales Confirmation',
      campaignId: this.campaign.campaignId,
      adjustments,
      targetings: this.targets,
      searchTerms: zeroSaleTerms.slice(0, 10).map(st => ({
        searchTerm: st.searchTerm,
        clicks: st.clicks,
        cost: st.cost
      })),
      reasoning:
        `3-day trend confirmed: $${this.cost.toFixed(2)} spent (avg $${avgDailySpend.toFixed(2)}/day) with zero sales. ` +
        `${this.clicks} clicks but no conversions. Reducing bids 25% and adding ${Math.min(10, zeroSaleTerms.length)} non-converting terms as negatives. ` +
        `Monitor for 7 days before pausing.`,
    };
  }
}
