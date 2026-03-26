import { ICampaignBundle, ICampaignRuleDecision } from "src/engine/interfaces";
import BaseRule, { config } from "../../base.rule";
import { AdjustmentLog, EAction, ETarget, Adjustment } from "src/schemas/log.schema";

/**
 * RULE: 30-Day Account Health Review (Structural Decision)
 * Condition: 30 days of performance data available
 * Action: Review overall ACOS, identify structural issues, recommend restructuring
 * NOTE: Long-term strategic decisions only
 */
export class ThirtyDayAccountHealthRule extends BaseRule implements ICampaignRuleDecision {
  private acosTarget: number = config.targetAcos;
  private minMonthlySpend: number = 1000;

  constructor(bundle: ICampaignBundle) {
    super(bundle);
  }

  shouldApply(): boolean {
    if (!this.metrics) return false;
    
    return (
      this.cost >= this.minMonthlySpend &&
      this.sales > 0
    );
  }

  execute(): AdjustmentLog {
    const acos = this.acos;
    const avgDailySpend = this.cost / 30;
    const avgDailyOrders = this.metrics.purchase / 30;
    const roi = this.roi;

    const healthStatus = acos <= this.acosTarget ? 'HEALTHY' : 'AT RISK';
    const recommendation = acos <= this.acosTarget * 0.8 ? 'SCALE' : 'MAINTAIN';

    const adjustments: Adjustment[] = [];

    return {
      ruleId: 'THIRTY_DAY_001',
      ruleName: '30-Day Account Health Review - Strategic Assessment',
      campaignId: this.campaign.campaignId,
      adjustments,
      reasoning:
        `30-DAY SUMMARY - Campaign: ${this.campaign.name}\n` +
        `Total Spend: $${this.cost.toFixed(2)} | Total Sales: $${this.sales.toFixed(2)} | Orders: ${this.metrics.purchase}\n` +
        `ACOS: ${(acos * 100).toFixed(2)}% (Target: ${(this.acosTarget * 100).toFixed(2)}%) | ROI: ${roi.toFixed(0)}%\n` +
        `Avg Daily: $${avgDailySpend.toFixed(2)} spend, ${avgDailyOrders.toFixed(1)} orders\n` +
        `Health Status: ${healthStatus} | Recommendation: ${recommendation}`,
    };
  }
}
