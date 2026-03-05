import { AutoCampaignAdjustment, ICampaignBundle, ICampaignRuleDecision, TargetingType } from "src/engine/interfaces";
import BaseRule from "../../base.rule";
import { Type } from "src/schemas/campaign.schema";

/**
 * RULE 003: Phrase Keyword Generating Consistent Sales
 * Indicators: Phrase keyword has consistent sales history
 * Action: Add Exact match, Increase bid 20% on exact, Increase campaign budget 10%
 */
export class PhraseKeywordToExactRule extends BaseRule implements ICampaignRuleDecision {
  private minConsistentSales: number;
  private acosTarget: number;

  constructor(bundle: ICampaignBundle) {
    super(bundle);
  }

  shouldApply(): boolean {
    if (this.campaign.targetingType !== Type.MANUAL) return false;
    if (!this.metrics) return false;

    // const metrics = campaign.metrics7d || campaign.metrics14d;

    const phraseKeywords = this.searchTerms.filter(st => 
      (st.searchTerm.endsWith('(phrase)') || st.searchTerm.includes('phrase')) &&
      st.sales7d >= this.minConsistentSales &&
      this.calculateACOS(st) <= this.acosTarget
    );

    return phraseKeywords.length > 0;
  }

  execute(): AutoCampaignAdjustment {
    const phraseKeywords = this.searchTerms.filter(st => 
      (st.searchTerm.endsWith('(phrase)') || st.searchTerm.includes('phrase')) &&
      st.sales7d >= this.minConsistentSales &&
      this.calculateACOS(st) <= this.acosTarget
    );

    return {
      ruleId: 'KEYWORD_MGMT_003',
      ruleName: 'Create Exact Match from Phrase Keyword',
      campaignId: this.campaign.campaignId,
      adjustments: {
        budgetChange: 10,
        bidChanges: [
          { targetingType:TargetingType.EXACT_MATCH, change: 20 },
        ],
        action: 'INCREASE',
      },
      reasoning:
        `${phraseKeywords.length} phrase keywords generating consistent sales with acceptable ACOS. ` +
        `Creating exact match variants to capture highest-intent traffic. ` +
        `Increasing bid 20% on exact matches and budget 10% to support scaling.`,
      // priority: 'MEDIUM',
      estimatedImpact: {
        estimatedSpend: phraseKeywords.reduce((sum, kw) => sum + kw.spend, 0) * 1.3,
        estimatedSales: phraseKeywords.reduce((sum, kw) => sum + kw.sales7d, 0) * 2.0,
      },
    };
  }
}