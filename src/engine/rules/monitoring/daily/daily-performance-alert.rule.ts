import { ICampaignBundle, ICampaignRuleDecision } from "src/engine/interfaces";
import BaseRule, { config } from "../../base.rule";
import { AdjustmentLog, EAction, ETarget, Adjustment } from "src/schemas/log.schema";

/**
 * RULE: Daily Performance Summary (Daily - 24 Hour)
 * Condition: End of day (trigger at 11 PM)
 * Action: Log performance, flag anomalies, prepare for next day
 * NOTE: Do NOT optimize based on single day - just monitor
 */
export class DailyPerformanceAlertRule extends BaseRule implements ICampaignRuleDecision {
  private minHourForCheck: number = 23; // 11 PM
  private acosTarget: number = config.targetAcos;

  constructor(bundle: ICampaignBundle) {
    super(bundle);
  }

  shouldApply(): boolean {
    if (!this.metrics) return false;
    const currentHour = new Date().getHours();
    return currentHour === this.minHourForCheck;
  }

  execute(): AdjustmentLog {
    const metrics = this.metrics;
    const acos = this.acos;
    const roi = this.roi;

    const alerts: string[] = [];
    if (acos > this.acosTarget * 1.5) alerts.push(`High ACOS: ${(acos * 100).toFixed(2)}%`);
    if (this.clicks > 100 && this.sales === 0) alerts.push('High traffic, zero sales');
    if (this.utilization > 0.8) alerts.push('Budget near limit');

    const adjustments: Adjustment[] = [];

    return {
      ruleId: 'DAILY_005',
      ruleName: 'Daily Performance Summary - End of Day Report',
      campaignId: this.campaign.campaignId,
      adjustments,
      reasoning:
        `Daily Summary: $${this.cost.toFixed(2)} spend, $${this.sales.toFixed(2)} sales, ` +
        `${this.metrics.purchase} orders. ACOS: ${(acos * 100).toFixed(2)}%, ROI: ${roi.toFixed(2)}%. ` +
        (alerts.length > 0 ? `ALERTS: ${alerts.join('; ')}` : 'Performance normal.'),
    };
  }
}
