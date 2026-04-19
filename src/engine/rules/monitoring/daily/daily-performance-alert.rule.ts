import { ICampaignRuleDecision } from "src/engine/interfaces";
import BaseDailyRule, { dailyConfig } from "./base-daily.rule";
import { AdjustmentLog, EAction, ETarget, Adjustment } from "src/schemas/log.schema";
import { DailyCampaignBundle } from "src/interfaces/index.type";

/**
 * RULE: Daily Performance Summary (Daily - 24 Hour)
 * Condition: End of day (trigger at 11 PM)
 * Action: Log performance, flag anomalies, prepare for next day
 * NOTE: Do NOT optimize based on single day - just monitor
 */
export class DailyPerformanceAlertRule extends BaseDailyRule implements ICampaignRuleDecision {
  private minHourForCheck: number = 23; // 11 PM

  constructor(bundle: DailyCampaignBundle) {
    super(bundle);
  }

  shouldApply(): boolean {
    if (!this.hasSearchTerms) return false;
    const currentHour = new Date().getHours();
    return currentHour === this.minHourForCheck;
  }

  execute(): AdjustmentLog {
    const acos = this.acos;
    const roas = this.roas;

    const alerts: string[] = [];
    if (acos > dailyConfig.acosTarget * 1.5) alerts.push(`High ACOS: ${(acos * 100).toFixed(2)}%`);
    if (this.totalClicks > 100 && this.totalSales === 0) alerts.push('High traffic, zero sales');
    if (this.budgetUsage && this.budgetUsage.budgetUsagePercent > 80) alerts.push('Budget near limit');

    const adjustments: Adjustment[] = [];

    return {
      ruleId: 'DAILY_005',
      ruleName: 'Daily Performance Summary - End of Day Report',
      campaignId: this.campaign.campaignId,
      campaignName: this.campaign.name,
      adjustments,
      reasoning:
        `Daily Summary: $${this.totalCost.toFixed(2)} spend, $${this.totalSales.toFixed(2)} sales, ` +
        `${this.totalClicks} clicks, ${this.totalImpressions} impressions. ` +
        `ACOS: ${(acos * 100).toFixed(2)}%, ROAS: ${roas.toFixed(2)}. ` +
        (alerts.length > 0 ? `ALERTS: ${alerts.join('; ')}` : 'Performance normal.'),
    };
  }
}
