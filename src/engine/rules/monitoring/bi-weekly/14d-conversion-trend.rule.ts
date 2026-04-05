import { ICampaignBundle, ICampaignRuleDecision } from "src/engine/interfaces";
import BaseRule, { config } from "../../base.rule";
import { AdjustmentLog, EAction, ETarget, Adjustment } from "src/schemas/log.schema";

/**
 * RULE: 14-Day Conversion Rate Trend (Scaling Decision)
 * Condition: Conversion rate changes >10% (either direction) over 14 days
 * Action: If improving, increase bids 20%; if declining, reduce 20%
 * NOTE: Detects listing/product performance changes
 */
export class FourteenDayConversionTrendRule extends BaseRule implements ICampaignRuleDecision {
  private conversionChangeThreshold: number = 0.1;

  constructor(bundle: ICampaignBundle) {
    super(bundle);
  }

  shouldApply(): boolean {
    if (!this.metrics || !this.budgetUsage) return false;

    if (this.clicks === 0) return false;

    // Compare current conversion rate to historical average
    const currentCvr = this.cvr;
    const avgCvr = this.budgetUsage.avgCvr || currentCvr;

    if (avgCvr === 0) return false;

    const change = Math.abs((currentCvr - avgCvr) / avgCvr);

    return change > this.conversionChangeThreshold;
  }

  execute(): AdjustmentLog {
    const currentCvr = this.cvr;
    const avgCvr = this.budgetUsage?.avgCvr || currentCvr;
    const change = ((currentCvr - avgCvr) / avgCvr) * 100;
    const isImproving = change > 0;

    const adjustments: Adjustment[] = [
      { action: isImproving ? EAction.INCREASE_BID : EAction.DECREASE_BID, change: isImproving ? 20 : -20, target: ETarget.TARGETING }
    ];

    return {
      ruleId: 'FOURTEEN_DAY_002',
      ruleName: '14-Day Conversion Rate Trend',
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
        isImproving
          ? `Conversion rate IMPROVING: ${currentCvr.toFixed(2)}% (current) vs ${avgCvr.toFixed(2)}% (historical avg). ` +
            `+${change.toFixed(0)}% improvement detected. Your listing/product is getting better reviews or performing well. ` +
            `Increasing bids 20% to capitalize on improving conversion.`
          : `Conversion rate DECLINING: ${currentCvr.toFixed(2)}% (current) vs ${avgCvr.toFixed(2)}% (historical avg). ` +
            `${change.toFixed(0)}% decline detected. Possible listing quality issue or market shift. ` +
            `Reducing bids 20% to minimize wasted spend. Investigate product feedback/reviews.`,
    };
  }
}
