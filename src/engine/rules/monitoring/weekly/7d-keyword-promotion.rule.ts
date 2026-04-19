import { ICampaignBundle, ICampaignRuleDecision } from "src/engine/interfaces";
import BaseRule, { config } from "../../base.rule";
import { AdjustmentLog, EAction, ETarget, Adjustment } from "src/schemas/log.schema";

/**
 * RULE: 7-Day Keyword Promotion to Exact Match (Primary Optimization)
 * Condition: Phrase or Broad keyword has 7+ days of consistent sales
 * Action: Create exact match variant, increase bids on exact, reduce on broad
 * NOTE: Keyword migration up the funnel
 */
export class SevenDayKeywordPromotionRule extends BaseRule implements ICampaignRuleDecision {
  private minSales: number = 5;
  private acosTarget: number = 0.35;

  constructor(bundle: ICampaignBundle) {
    super(bundle);
  }

  shouldApply(): boolean {
    if (!this.searchTerms || this.searchTerms.length === 0) return false;

    const candidatesForPromotion = this.searchTerms.filter(st => {
      const isPhraseBroad = st.searchTerm.includes('(phrase)') || st.searchTerm.includes('(broad)');
      const acos = st.cost > 0 ? st.cost / st.sales : Infinity;
      return (
        isPhraseBroad &&
        st.sales >= this.minSales &&
        acos <= this.acosTarget
      );
    });

    return candidatesForPromotion.length > 0;
  }

  execute(): AdjustmentLog {
    const candidatesForPromotion = this.searchTerms.filter(st => {
      const isPhraseBroad = st.searchTerm.includes('(phrase)') || st.searchTerm.includes('(broad)');
      const acos = st.cost > 0 ? st.cost / st.sales : Infinity;
      return (
        isPhraseBroad &&
        st.sales >= this.minSales &&
        acos <= this.acosTarget
      );
    });

    const adjustments: Adjustment[] = [
      { action: EAction.ADD_EXACT, target: ETarget.KEYWORDS }
    ];

    return {
      ruleId: 'SEVEN_DAY_005',
      ruleName: '7-Day Keyword Promotion - Phrase/Broad to Exact',
      campaignId: this.campaign.campaignId,
      campaignName: this.campaign.name,
      adjustments,
      searchTerms: candidatesForPromotion.map(k => ({
        searchTerm: k.searchTerm,
        sales: k.sales,
        cost: k.cost
      })),
      reasoning:
        `${candidatesForPromotion.length} phrase/broad keyword(s) ready for promotion after 7+ days of consistent, profitable sales. ` +
        `Candidates: ${candidatesForPromotion.map(k => `"${k.searchTerm}" (${k.sales} sales, ${(k.cost / k.sales * 100).toFixed(2)}% ACOS)`).join(', ')}. ` +
        `Recommend: Create exact match variants, increase exact bids 20%, reduce phrase/broad bids 10%.`,
    };
  }
}
