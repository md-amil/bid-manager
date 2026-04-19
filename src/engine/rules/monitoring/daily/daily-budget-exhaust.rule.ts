import { ICampaignRuleDecision } from "src/engine/interfaces";
import BaseDailyRule, { dailyConfig } from "./base-daily.rule";
import { AdjustmentLog, EAction, ETarget, Adjustment } from "src/schemas/log.schema";
import { DailyCampaignBundle } from "src/interfaces/index.type";

/**
 * RULE: Campaign Out of Budget (Daily - 24 Hour)
 * Condition: Daily spend reaches 95%+ of budget before evening
 * Action: If profitable, increase budget 25%; if not, reduce bids 25%
 * NOTE: Do NOT optimize based on one bad day
 */

export class DailyBudgetExhaustionRule extends BaseDailyRule implements ICampaignRuleDecision {
  private budgetUtilizationThreshold: number = 0.95;
  private minHourForCheck: number = 18; // 6 PM

  constructor(bundle: DailyCampaignBundle) {
    super(bundle);
  }

  shouldApply(): boolean {
    if (!this.budgetUsage) return false;
    
    const budgetUtilization = this.budgetUsage.budgetUsagePercent / 100;
    const currentHour = new Date().getHours();
    
    // Check late in the day (after minHourForCheck)
    if (currentHour < this.minHourForCheck) return false;

    return budgetUtilization >= this.budgetUtilizationThreshold;
  }

  execute(): AdjustmentLog {
    const isProfitable = this.acos <= dailyConfig.acosTarget;

    const adjustments: Adjustment[] = isProfitable
      ? [{ action: EAction.INCREASE_BUDGET, change: 25 }]
      : [{ action: EAction.DECREASE_BID, change: -25, target: ETarget.TARGETING }];

    return {
      ruleId: 'DAILY_001',
      ruleName: 'Daily Budget Exhaustion - Real-Time Control',
      campaignId: this.campaign.campaignId,
      campaignName: this.campaign.name,
      adjustments,
      targetings: this.getTargets(),
      reasoning:
        `Campaign exhausted ${(this.budgetUsage.budgetUsagePercent).toFixed(0)}% of daily budget. ` +
        (isProfitable
          ? `ACOS ${(this.acos * 100).toFixed(2)}% is profitable. Increasing budget 25% to capture more sales.`
          : `ACOS ${(this.acos * 100).toFixed(2)}% is unprofitable. Reducing bids 25% instead of increasing budget.`),
    };
  }
}
