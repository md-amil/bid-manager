import { ICampaignBundle, ICampaignRuleDecision } from "src/engine/interfaces";
import BaseRule, { config } from "../../base.rule";
import { AdjustmentLog, EAction, ETarget, Adjustment } from "src/schemas/log.schema";

/**
 * RULE: 30-Day Budget Misallocation Detection (Structural Decision)
 * Condition: 30-day data shows significant performance variance between campaigns
 * Action: Reallocate budget from poor performers to winners
 * NOTE: Maximize portfolio ROI
 */
export class ThirtyDayBudgetReallocationRule extends BaseRule implements ICampaignRuleDecision {
  private poorPerformerAcosThreshold: number = 0.50;
  private goodPerformerAcosThreshold: number = 0.20;
  private minSpend: number = 500;

  constructor(bundle: ICampaignBundle) {
    super(bundle);
  }

  shouldApply(): boolean {
    if (!this.metrics) return false;

    const acos = this.acos;

    // Flag if this campaign is a poor performer
    return (
      acos >= this.poorPerformerAcosThreshold &&
      this.cost > this.minSpend
    );
  }

  execute(): AdjustmentLog {
    const acos = this.acos;

    const adjustments: Adjustment[] = [
      { action: EAction.DECREASE_BUDGET, change: -25 }
    ];

    return {
      ruleId: 'THIRTY_DAY_003',
      ruleName: '30-Day Budget Misallocation - Reallocation Recommendation',
      campaignId: this.campaign.campaignId,
      adjustments,
      reasoning:
        `This campaign's 30-day ACOS is ${(acos * 100).toFixed(2)}% (above healthy ${(this.poorPerformerAcosThreshold * 100).toFixed(2)}% threshold). ` +
        `Spent $${this.cost.toFixed(2)} with only $${this.sales.toFixed(2)} sales. ` +
        `Recommendation: Reduce budget by 25% and reallocate to campaigns performing below ${(this.goodPerformerAcosThreshold * 100).toFixed(2)}% ACOS. ` +
        `This portfolio optimization can improve overall ROI significantly.`,
    };
  }
}
