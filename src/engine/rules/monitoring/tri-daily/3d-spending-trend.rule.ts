import { ICampaignBundle, ICampaignRuleDecision } from "src/engine/interfaces";
import BaseRule, { config } from "../../base.rule";
import { AdjustmentLog, EAction, ETarget, Adjustment } from "src/schemas/log.schema";

/**
 * RULE: 3-Day Spending Trend Analysis (72 Hour)
 * Condition: Spend increasing each day without corresponding sales growth
 * Action: Reduce bids 20% if trend shows cost per sale is rising
 * NOTE: Detects efficiency degradation
 */
export class ThreeDaySpendingTrendRule extends BaseRule implements ICampaignRuleDecision {
  private costPerSaleIncreaseThreshold: number = 0.2;

  constructor(bundle: ICampaignBundle) {
    super(bundle);
  }

  shouldApply(): boolean {
    if (!this.metrics || !this.budgetUsage) return false;

    // Need sufficient data
    if (this.sales < 2) return false;

    const currentCps = this.cost / this.sales;
    const avgCps = this.budgetUsage.avgCps || currentCps;

    // Check if cost per sale is increasing
    const increase = (currentCps - avgCps) / avgCps;

    return increase > this.costPerSaleIncreaseThreshold;
  }

  execute(): AdjustmentLog {
    const currentCps = this.cost / this.sales;
    const avgCps = this.budgetUsage?.avgCps || currentCps;
    const increase = ((currentCps - avgCps) / avgCps) * 100;

    const adjustments: Adjustment[] = [
      { action: EAction.DECREASE_BID, change: -20, target: ETarget.TARGETING }
    ];

    return {
      ruleId: 'THREE_DAY_003',
      ruleName: '3-Day Efficiency Degradation - Trend Alert',
      campaignId: this.campaign.campaignId,
      adjustments,
      targetings: this.targets,
      reasoning:
        `Cost per sale degrading: ${increase.toFixed(0)}% increase over 3 days. ` +
        `Current cost per sale: $${currentCps.toFixed(2)} vs average: $${avgCps.toFixed(2)}. ` +
        `This indicates worsening campaign efficiency. Reducing bids 20% to slow the trend.`,
    };
  }
}
