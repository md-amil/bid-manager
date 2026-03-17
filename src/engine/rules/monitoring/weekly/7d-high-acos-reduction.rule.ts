import { ICampaignBundle, ICampaignRuleDecision } from "src/engine/interfaces";
import BaseRule, { config } from "../../base.rule";
import { AdjustmentLog, EAction, ETarget, Adjustment } from "src/schemas/log.schema";

/**
 * RULE: 7-Day ACOS Above Target (Primary Optimization)
 * Condition: ACOS consistently above target for 7+ days
 * Action: Reduce bids 25%, pause underperforming keywords
 * NOTE: This is the primary decision window - act here
 */
export class SevenDayHighAcosReductionRule extends BaseRule implements ICampaignRuleDecision {
  private acosTarget: number = config.targetAcos;
  private minSpend: number = 200;

  constructor(bundle: ICampaignBundle) {
    super(bundle);
  }

  shouldApply(): boolean {
    if (!this.metrics) return false;

    if (this.sales === 0 || this.cost < this.minSpend) return false;

    return this.acos > this.acosTarget;
  }

  execute(): AdjustmentLog {
    const acos = this.acos;

    // Find worst performing search terms
    const underperformingTerms = this.searchTerms
      .filter(st => {
        const termAcos = st.cost > 0 ? st.cost / st.sales7d : Infinity;
        return termAcos > this.acosTarget * 1.5 && st.cost > 50;
      })
      .sort((a, b) => {
        const acosA = a.cost / (a.sales7d || 1);
        const acosB = b.cost / (b.sales7d || 1);
        return acosB - acosA;
      })
      .slice(0, 5); // Top 5 worst

    const adjustments: Adjustment[] = [
      { action: EAction.DECREASE_BID, change: -25, target: ETarget.TARGETING }
    ];

    return {
      ruleId: 'SEVEN_DAY_001',
      ruleName: '7-Day High ACOS - Primary Optimization',
      campaignId: this.campaign.campaignId,
      adjustments,
      targetings: this.targets,
      searchTerms: underperformingTerms.map(st => ({
        searchTerm: st.searchTerm,
        spend: st.cost,
        sales7d: st.sales7d
      })),
      reasoning:
        `7-day ACOS ${(acos * 100).toFixed(2)}% exceeds target ${(this.acosTarget * 100).toFixed(2)}%. ` +
        `Campaign spent $${this.cost.toFixed(2)} with $${this.sales.toFixed(2)} sales. ` +
        `Reducing all bids 25%. Identified ${underperformingTerms.length} keywords to pause: ` +
        `${underperformingTerms.map(t => t.searchTerm).join(', ')}`,
    };
  }
}
