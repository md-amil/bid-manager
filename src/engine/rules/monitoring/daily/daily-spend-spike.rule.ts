import { ICampaignBundle, ICampaignRuleDecision } from "src/engine/interfaces";
import BaseRule, { config } from "../../base.rule";
import { AdjustmentLog, EAction, ETarget, Adjustment } from "src/schemas/log.schema";

/**
 * RULE: Sudden Spend Spike (Daily - 24 Hour)
 * Condition: Daily spend increases 50%+ compared to 3-day average
 * Action: Reduce bids 25% if no corresponding sales increase
 * NOTE: Only reduce if the spending didn't result in proportional sales
 */

export class DailySpendSpikeRule extends BaseRule implements ICampaignRuleDecision {
  private spendIncreaseThreshold: number = 0.5;
  private minAverageSpend: number = 100;

  constructor(bundle: ICampaignBundle) {
    super(bundle);
  }

  shouldApply(): boolean {
    if (!this.metrics || !this.budgetUsage) return false;

    // Compare current spend to historical average from budgetUsage
    const avgSpend = this.budgetUsage.avgSpend || this.cost;
    const spendIncrease = (this.cost - avgSpend) / avgSpend;

    // Only flag if average spend is meaningful
    return spendIncrease > this.spendIncreaseThreshold && avgSpend >= this.minAverageSpend;
  }

  execute(): AdjustmentLog {
    const avgSpend = this.budgetUsage?.avgSpend || this.cost;
    const spendIncrease = ((this.cost - avgSpend) / avgSpend) * 100;

    const currentAcos = this.acos;
    const avgAcos = this.budgetUsage?.avgAcos || currentAcos;

    // If ACOS worsened significantly, reduce bids
    const acosWorsened = currentAcos > avgAcos * 1.2; // 20% worse

    const adjustments: Adjustment[] = acosWorsened
      ? [{ action: EAction.DECREASE_BID, change: -25, target: ETarget.TARGETING }]
      : [];

    return {
      ruleId: 'DAILY_002',
      ruleName: 'Daily Spend Spike - Anomaly Detection',
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
        `Unusual spend spike detected: +${spendIncrease.toFixed(0)}% above average. ` +
        (acosWorsened
          ? `ACOS worsened (${(currentAcos * 100).toFixed(2)}% vs ${(avgAcos * 100).toFixed(2)}%). Reducing bids 25%.`
          : `ACOS remained consistent. Monitor, do not reduce yet.`),
    };
  }
}
