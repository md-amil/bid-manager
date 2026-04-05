import { ICampaignBundle, ICampaignRuleDecision } from "src/engine/interfaces";
import BaseRule, { config } from "../../base.rule";
import { AdjustmentLog, EAction, ETarget, Adjustment } from "src/schemas/log.schema";

/**
 * RULE: 14-Day Budget Efficiency Optimization (Scaling Decision)
 * Condition: Campaign using <60% of allocated budget while profitable
 * Action: Increase bids to capture more volume without increasing budget
 * NOTE: Maximize existing budget allocation
 */
export class FourteenDayBudgetEfficiencyRule extends BaseRule implements ICampaignRuleDecision {
  private budgetUtilizationThreshold: number = 0.6;
  private acosTarget: number = config.targetAcos;

  constructor(bundle: ICampaignBundle) {
    super(bundle);
  }

  shouldApply(): boolean {
    if (!this.metrics) return false;

    const budgetUtilization = this.utilization;
    const acos = this.acos;

    return (
      budgetUtilization < this.budgetUtilizationThreshold &&
      acos <= this.acosTarget &&
      this.sales > 0
    );
  }

  execute(): AdjustmentLog {
    const avgDailySpend = this.cost / 14;
    const budgetUtilization = (avgDailySpend / this.budget) * 100;

    const adjustments: Adjustment[] = [
      { action: EAction.INCREASE_BID, change: 20, target: ETarget.TARGETING }
    ];

    return {
      ruleId: 'FOURTEEN_DAY_004',
      ruleName: '14-Day Budget Under-Utilization - Bid Increase',
      campaignId: this.campaign.campaignId,
      campaignName: this.campaign.name,
      adjustments,
      targetings: this.targets.map(t => ({
        targetId: t.targetId,
        targetingType: t.metrics.targeting,
        expression: t.expression[0].type || '',
        bid: t.bid
      })),
      reasoning:
        `Budget under-utilized: Using only ${budgetUtilization.toFixed(0)}% of available budget ($${avgDailySpend.toFixed(2)}/day vs $${this.budget.toFixed(2)}/day). ` +
        `ACOS is healthy and profitable. Increasing bids 20% to capture more volume and spend the full budget efficiently.`,
    };
  }
}
