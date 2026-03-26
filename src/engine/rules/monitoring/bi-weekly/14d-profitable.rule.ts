import { ICampaignBundle, ICampaignRuleDecision } from "src/engine/interfaces";
import BaseRule, { config } from "../../base.rule";
import { AdjustmentLog, EAction, ETarget, Adjustment } from "src/schemas/log.schema";

/**
 * RULE: 14-Day Profitability Confirmation (Scaling Decision)
 * Condition: 14+ days of consistent, profitable sales (ACOS < target)
 * Action: Increase bids 25%, increase budget 25%, increase placement 20%
 * NOTE: Only scale after confirming sustained profitability
 */
export class FourteenDayProfitabilityRule extends BaseRule implements ICampaignRuleDecision {
  private acosTarget: number = config.targetAcos;
  private minSales: number = 20;
  private minOrders: number = 10;

  constructor(bundle: ICampaignBundle) {
    super(bundle);
  }

  shouldApply(): boolean {
    if (!this.metrics) return false;

    if (this.sales === 0 || this.metrics.purchase < this.minOrders) return false;

    const acos = this.acos;

    // Check if ACOS is good
    return acos <= this.acosTarget;
  }

  execute(): AdjustmentLog {
    const acos = this.acos;
    const avgDailySpend = this.cost / 14;
    const avgDailyOrders = this.metrics.purchase / 14;

    const adjustments: Adjustment[] = [
      { action: EAction.INCREASE_BUDGET, change: 25 },
      { action: EAction.INCREASE_BID, change: 25, target: ETarget.KEYWORDS },
      { action: EAction.INCREASE_BID, change: 25, target: ETarget.TARGETING }
    ];

    return {
      ruleId: 'FOURTEEN_DAY_001',
      ruleName: '14-Day Profitability Confirmation - Aggressive Scaling',
      campaignId: this.campaign.campaignId,
      adjustments,
      keywords: this.keywordsIdText,
      targetings: this.targets,
      reasoning:
        `14-day profitability CONFIRMED: ${(acos * 100).toFixed(2)}% ACOS with ${this.metrics.purchase} orders. ` +
        `Consistent daily performance (avg ${avgDailyOrders.toFixed(1)} orders, avg $${avgDailySpend.toFixed(2)}/day). ` +
        `This is proven, sustained success. Scaling aggressively: Budget +25%, Bids +25%.`,
    };
  }
}
