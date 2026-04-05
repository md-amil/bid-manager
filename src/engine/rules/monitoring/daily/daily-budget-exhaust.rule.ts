import { ICampaignBundle, ICampaignRuleDecision } from "src/engine/interfaces";
import BaseRule, { config } from "../../base.rule";
import { AdjustmentLog, EAction, ETarget, Adjustment } from "src/schemas/log.schema";

/**
 * RULE: Campaign Out of Budget (Daily - 24 Hour)
 * Condition: Daily spend reaches 95%+ of budget before evening
 * Action: If profitable, increase budget 25%; if not, reduce bids 25%
 * NOTE: Do NOT optimize based on one bad day
 */

export class DailyBudgetExhaustionRule extends BaseRule implements ICampaignRuleDecision {
  private budgetUtilizationThreshold: number = 0.95;
  private acosTarget: number = 0.30;
  private minHourForCheck: number = 18; // 6 PM check

  constructor(bundle: ICampaignBundle) {
    super(bundle);
  }

  shouldApply(): boolean {
    if (!this.metrics) return false;

    const dailyUtilization = this.utilization;
    const currentHour = new Date().getHours();
    // Check late in the day (after minHourForCheck)
    if (currentHour < this.minHourForCheck) return false;

    return dailyUtilization >= this.budgetUtilizationThreshold;
  }

  execute(): AdjustmentLog {
    const metrics = this.metrics;
    const acos = this.acos;
    const isProfitable = acos <= this.acosTarget;

    const adjustments: Adjustment[] = isProfitable
      ? [{ action: EAction.INCREASE_BUDGET, change: 25 }]
      : [{ action: EAction.DECREASE_BID, change: -25, target: ETarget.TARGETING }];

    return {
      ruleId: 'DAILY_001',
      ruleName: 'Daily Budget Exhaustion - Real-Time Control',
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
        `Campaign exhausted ${(this.utilization * 100).toFixed(0)}% of daily budget before evening. ` +
        (isProfitable
          ? `ACOS ${(acos * 100).toFixed(2)}% is profitable. Increasing budget 25% to capture more sales.`
          : `ACOS ${(acos * 100).toFixed(2)}% is unprofitable. Reducing bids 25% instead of increasing budget.`),
    };
  }
}
