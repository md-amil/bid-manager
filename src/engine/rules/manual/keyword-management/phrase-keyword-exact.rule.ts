import { AutoCampaignAdjustment, ICampaignBundle, ICampaignRuleDecision, TargetingType } from "src/engine/interfaces";
import BaseRule from "../../base.rule";
import { Type } from "src/schemas/campaign.schema";
import { AdjustmentLog, EAction, ETarget } from "src/schemas/log.schema";
import { MatchType } from "src/schemas/keyword.schema";
import { SearchTermDocument } from "src/schemas/reports/search-term-report.schema";

/**
 * RULE 003: Phrase Keyword Generating Consistent Sales
 * Indicators: Phrase keyword has consistent sales history
 * Action: Add Exact match, Increase bid 20% on exact, Increase campaign budget 10%
 */
export class PhraseKeywordToExactRule extends BaseRule implements ICampaignRuleDecision {
  private terms: SearchTermDocument[]
  private minConsistentSales: number;
  private acosTarget: number;

  constructor(bundle: ICampaignBundle) {
    super(bundle);
    this.terms = this.getSearchTerms(MatchType.PHRASE)
  }

  shouldApply(): boolean {
    if (this.campaign.targetingType !== Type.MANUAL) return false;
    if (!this.metrics) return false;

    const consistantTerms = this.terms.filter(st =>
      st.sales7d >= this.minConsistentSales &&
      this.calculateACOS(st) <= this.acosTarget
    );
    return consistantTerms.length > 0;
  }

  execute(): AdjustmentLog {
    // const phraseKeywords = this.searchTerms.filter(st => 
    //   (st.searchTerm.endsWith('(phrase)') || st.searchTerm.includes('phrase')) &&
    //   st.sales7d >= this.minConsistentSales &&
    //   this.calculateACOS(st) <= this.acosTarget
    // );

    const consistantTerms = this.terms.filter(st =>
      st.sales7d >= this.minConsistentSales &&
      this.calculateACOS(st) <= this.acosTarget
    );

    const exactKeyword = this.keywords.filter(k => k.matchType == MatchType.EXACT)

    return {
      ruleId: 'KEYWORD_MGMT_003',
      ruleName: 'Create Exact Match from Phrase Keyword',
      campaignId: this.campaign.campaignId,
      adjustments: [
        {
          action: EAction.INCREASE_BUDGET,
          change: 10
        },
        {
          action: EAction.INCREASE_BID,
          target: ETarget.KEYWORDS,
          change: 20
        },
        {
          action: EAction.ADD_EXACT,
          target: ETarget.TERMS
        },

      ],
      searchTerms: consistantTerms,
      keywords: exactKeyword,
      reasoning:
        `${consistantTerms.length} phrase keywords generating consistent sales with acceptable ACOS. ` +
        `Creating exact match variants to capture highest-intent traffic. ` +
        `Increasing bid 20% on exact matches and budget 10% to support scaling.`,
    };
  }
}