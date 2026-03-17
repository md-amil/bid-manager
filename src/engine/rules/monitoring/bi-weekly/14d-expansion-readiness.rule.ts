import { ICampaignBundle, ICampaignRuleDecision } from "src/engine/interfaces";
import BaseRule, { config } from "../../base.rule";
import { AdjustmentLog, EAction, ETarget, Adjustment } from "src/schemas/log.schema";

/**
 * RULE: 14-Day Keyword Saturation Check (Scaling Decision)
 * Condition: Campaign spending at max but not getting diminishing returns
 * Action: Expand targeting, add new keywords, scale up
 * NOTE: Ready for aggressive growth
 */
export class FourteenDayExpansionReadinessRule extends BaseRule implements ICampaignRuleDecision {
  private budgetUtilizationThreshold: number = 0.85;
  private acosTarget: number = config.targetAcos;
  private minOrders: number = 20;

  constructor(bundle: ICampaignBundle) {
    super(bundle);
  }

  shouldApply(): boolean {
    if (!this.metrics) return false;

    const budgetUtilization = this.utilization;
    const acos = this.acos;

    return (
      budgetUtilization >= this.budgetUtilizationThreshold &&
      acos <= this.acosTarget &&
      this.metrics.purchases7d >= this.minOrders
    );
  }

  execute(): AdjustmentLog {
    const budgetUtilization = this.utilization;

    const adjustments: Adjustment[] = [
      { action: EAction.INCREASE_BUDGET, change: 25 },
      { action: EAction.INCREASE_BID, change: 15, target: ETarget.TARGETING }
    ];

    return {
      ruleId: 'FOURTEEN_DAY_005',
      ruleName: '14-Day Expansion Readiness - Growth Signal',
      campaignId: this.campaign.campaignId,
      adjustments,
      targetings: this.targets,
      reasoning:
        `Campaign is at full budget capacity (using ${(budgetUtilization * 100).toFixed(0)}% of budget) ` +
        `with healthy ACOS (${(this.acos * 100).toFixed(2)}%) and ${this.metrics.purchases7d} orders. ` +
        `This indicates market saturation at current targeting. You're ready to expand: Increase budget 25%, increase bids 15%, ` +
        `and add new keywords/ASINs to fuel growth.`,
    };
  }
}
