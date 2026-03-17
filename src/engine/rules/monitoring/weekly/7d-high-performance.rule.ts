import { ICampaignBundle, ICampaignRuleDecision } from "src/engine/interfaces";
import BaseRule, { config } from "../../base.rule";
import { AdjustmentLog, EAction, ETarget, Adjustment } from "src/schemas/log.schema";

/**
 * RULE: 7-Day High Performer Identification (Primary Optimization)
 * Condition: Keywords with 30%+ ACOS savings (ACOS 20% or better)
 * Action: Increase bids 20% on these winners, move to exact match
 * NOTE: Consolidate winners for better ROI
 */
export class SevenDayHighPerformerRule extends BaseRule implements ICampaignRuleDecision {
  private acosTarget: number = 0.20;
  private minSales: number = 5;

  constructor(bundle: ICampaignBundle) {
    super(bundle);
  }

  shouldApply(): boolean {
    if (!this.searchTerms || this.searchTerms.length === 0) return false;

    const winners = this.searchTerms.filter(st => {
      if (st.sales7d < this.minSales || st.cost === 0) return false;
      const acos = st.cost / st.sales7d;
      return acos <= this.acosTarget;
    });

    return winners.length > 0;
  }

  execute(): AdjustmentLog {
    const winners = this.searchTerms
      .filter(st => {
        if (st.sales7d < this.minSales || st.cost === 0) return false;
        const acos = st.cost / st.sales7d;
        return acos <= this.acosTarget;
      })
      .sort((a, b) => {
        const acosA = a.cost / a.sales7d;
        const acosB = b.cost / b.sales7d;
        return acosA - acosB;
      });

    const adjustments: Adjustment[] = [
      { action: EAction.INCREASE_BID, change: 20, target: ETarget.KEYWORDS }
    ];

    return {
      ruleId: 'SEVEN_DAY_004',
      ruleName: '7-Day High Performer Scaling',
      campaignId: this.campaign.campaignId,
      adjustments,
      keywords: winners.slice(0, 10).map(w => ({
        keywordText: w.searchTerm,
        keywordId: w.keywordId || ''
      })),
      reasoning:
        `Identified ${winners.length} high-performing keyword(s) with ACOS ≤ ${(this.acosTarget * 100).toFixed(2)}%. ` +
        `Top performers: ${winners.slice(0, 3).map(w => `"${w.searchTerm}" (${(w.cost / w.sales7d * 100).toFixed(2)}% ACOS)`).join(', ')}. ` +
        `Increasing bids 20% on these winners and recommending conversion to exact match for better control.`,
    };
  }
}
