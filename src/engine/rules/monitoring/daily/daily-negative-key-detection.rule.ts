import { ICampaignBundle, ICampaignRuleDecision } from "src/engine/interfaces";
import BaseRule, { config } from "../../base.rule";
import { AdjustmentLog, EAction, ETarget, Adjustment } from "src/schemas/log.schema";

/**
 * RULE: Daily Negative Keyword Addition (Daily - 24 Hour)
 * Condition: Single search term gets 20+ clicks with 0 sales in one day
 * Action: Add as negative exact match to prevent repeat wasting
 * NOTE: Real-time quality control
 */
export class DailyNegativeKeywordDetectionRule extends BaseRule implements ICampaignRuleDecision {
  private clickThreshold: number = 20;

  constructor(bundle: ICampaignBundle) {
    super(bundle);
  }

  shouldApply(): boolean {
    if (!this.searchTerms || this.searchTerms.length === 0) return false;
    
    const badTerms = this.searchTerms.filter(st =>
      st.clicks >= this.clickThreshold && st.sales7d === 0
    );

    return badTerms.length > 0;
  }

  execute(): AdjustmentLog {
    const badTerms = this.searchTerms.filter(st =>
      st.clicks >= this.clickThreshold && st.sales7d === 0
    );

    const adjustments: Adjustment[] = [
      { action: EAction.ADD_NEGATIVE, target: ETarget.TERMS }
    ];

    return {
      ruleId: 'DAILY_004',
      ruleName: 'Daily Negative Keywords - Quality Control',
      campaignId: this.campaign.campaignId,
      adjustments,
      searchTerms: badTerms.map(st => ({
        searchTerm: st.searchTerm,
        clicks: st.clicks,
        cost: st.cost
      })),
      reasoning:
        `${badTerms.length} search term(s) with ${this.clickThreshold}+ clicks, zero sales detected today. ` +
        `Adding to negative exact matches: ${badTerms.map(st => st.searchTerm).join(', ')}`,
    };
  }
}
