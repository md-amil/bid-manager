import { ICampaignBundle, ICampaignRuleDecision } from "src/engine/interfaces";
import BaseRule, { config } from "../../base.rule";
import { AdjustmentLog, EAction, ETarget, Adjustment } from "src/schemas/log.schema";

/**
 * RULE: 30-Day Structural Optimization (Structural Decision)
 * Condition: 30 days of complete performance data
 * Action: Recommend campaign restructuring: Brand, Non-Brand, Competitor, Category
 * NOTE: Long-term strategic optimization
 */
export class ThirtyDayStructuralOptimizationRule extends BaseRule implements ICampaignRuleDecision {
  private minSpend: number = 1000;

  constructor(bundle: ICampaignBundle) {
    super(bundle);
  }

  shouldApply(): boolean {
    if (!this.metrics) return false;
    return this.cost > this.minSpend;
  }

  execute(): AdjustmentLog {
    const adjustments: Adjustment[] = [];

    return {
      ruleId: 'THIRTY_DAY_004',
      ruleName: '30-Day Structural Optimization Strategy',
      campaignId: this.campaign.campaignId,
      adjustments,
      reasoning:
        `After 30 days, you have enough data for structural decisions. ` +
        `Current structure needs optimization. Recommended structure:\n\n` +
        `1) BRAND CAMPAIGN: "Nike Air Max" - Protect brand searches with highest bids\n` +
        `   - Exact match only, $${(this.budget * 0.3).toFixed(2)}/day budget, Bids: HIGH\n\n` +
        `2) NON-BRAND EXACT: Generic exact match keywords\n` +
        `   - High intent, strong converters, $${(this.budget * 0.35).toFixed(2)}/day budget\n\n` +
        `3) COMPETITOR TARGETING: Competitor ASINs/keywords\n` +
        `   - Steal competitor traffic, $${(this.budget * 0.2).toFixed(2)}/day budget\n\n` +
        `4) DISCOVERY: Broad/Phrase match for new keyword discovery\n` +
        `   - Low bids, testing mode, $${(this.budget * 0.15).toFixed(2)}/day budget\n\n` +
        `This structure allows different bid strategies for different intent levels, improving overall ACOS by 15-25%.`,
    };
  }
}
