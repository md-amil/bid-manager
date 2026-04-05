import { ICampaignBundle, ICampaignRuleDecision } from "src/engine/interfaces";
import BaseRule, { config } from "../../base.rule";
import { AdjustmentLog, EAction, ETarget, Adjustment } from "src/schemas/log.schema";

/**
 * RULE: 30-Day Campaign Overlap Detection (Structural Decision)
 * Condition: Multiple campaigns bidding on same keywords
 * Action: Consolidate or separate by match type, reduce internal competition
 * NOTE: Structural inefficiency cleanup
 */
export class ThirtyDayCampaignOverlapRule extends BaseRule implements ICampaignRuleDecision {
  private minSpend: number = 500;

  constructor(bundle: ICampaignBundle) {
    super(bundle);
  }

  shouldApply(): boolean {
    if (!this.metrics) return false;

    // In real implementation, would compare against other campaigns
    // For now, flag if spending heavily on broad match (likely overlap)
    // Heuristic: if broad match exists and has spend
    const hasBroadMatch = this.searchTerms.some(st =>
      st.searchTerm.includes('broad')
    );

    return hasBroadMatch && this.cost > this.minSpend;
  }

  execute(): AdjustmentLog {
    const broadMatchTerms = this.searchTerms.filter(st => st.searchTerm.includes('broad'));

    const adjustments: Adjustment[] = [];

    return {
      ruleId: 'THIRTY_DAY_002',
      ruleName: '30-Day Campaign Overlap Detection',
      campaignId: this.campaign.campaignId,
      campaignName: this.campaign.name,
      
      adjustments,
      reasoning:
        `Campaign Structure Review: Potential overlap detected with broad/phrase match targeting. ` +
        `Recommendation: Audit all campaigns for the same ASIN/product. Consider restructuring: ` +
        `1) Brand + Non-Brand separation, 2) Match type separation (Exact in Campaign A, Phrase in Campaign B, Broad in Campaign C), ` +
        `3) Competitor targeting in separate campaigns. This reduces internal competition and improves ROI.`,
    };
  }
}
