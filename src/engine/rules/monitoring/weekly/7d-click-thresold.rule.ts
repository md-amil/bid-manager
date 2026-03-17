import { ICampaignBundle, ICampaignRuleDecision } from "src/engine/interfaces";
import BaseRule, { config } from "../../base.rule";
import { AdjustmentLog, EAction, ETarget, Adjustment } from "src/schemas/log.schema";

/**
 * RULE: 7-Day Click Threshold Reached (Primary Optimization)
 * Condition: Single keyword reaches 20+ clicks without conversions
 * Action: Pause the keyword, add to negatives
 * NOTE: Clear signal that keyword is irrelevant
 */
export class SevenDayClickThresholdRule extends BaseRule implements ICampaignRuleDecision {
  private clickThreshold: number = 20;

  constructor(bundle: ICampaignBundle) {
    super(bundle);
  }

  shouldApply(): boolean {
    if (!this.searchTerms || this.searchTerms.length === 0) return false;

    const nonConvertingTerms = this.searchTerms.filter(st =>
      st.clicks >= this.clickThreshold && st.sales7d === 0
    );

    return nonConvertingTerms.length > 0;
  }

  execute(): AdjustmentLog {
    const nonConvertingTerms = this.searchTerms
      .filter(st => st.clicks >= this.clickThreshold && st.sales7d === 0)
      .sort((a, b) => b.clicks - a.clicks);

    const adjustments: Adjustment[] = [
      { action: EAction.ADD_NEGATIVE, target: ETarget.TERMS }
    ];

    return {
      ruleId: 'SEVEN_DAY_002',
      ruleName: '7-Day Click Threshold - Keyword Elimination',
      campaignId: this.campaign.campaignId,
      adjustments,
      searchTerms: nonConvertingTerms.map(st => ({
        searchTerm: st.searchTerm,
        clicks: st.clicks,
        cost: st.cost
      })),
      reasoning:
        `Found ${nonConvertingTerms.length} keyword(s) with ${this.clickThreshold}+ clicks but zero sales over 7 days. ` +
        `These keywords are clearly irrelevant. Adding to negative exact matches: ` +
        `${nonConvertingTerms.map(t => `"${t.searchTerm}" (${t.clicks} clicks)`).join(', ')}. ` +
        `This prevents future wasted spend.`,
    };
  }
}
