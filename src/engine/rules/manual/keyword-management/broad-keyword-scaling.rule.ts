import { AutoCampaignAdjustment, ICampaignBundle, ICampaignRuleDecision, TargetingType } from "src/engine/interfaces";
import BaseRule, { config } from "../../base.rule";
import { Type } from "src/schemas/campaign.schema";
import { AdjustmentLog, EAction, ETarget } from "src/schemas/log.schema";
import { MatchType } from "src/schemas/keyword.schema";
import { SearchTermDocument } from "src/schemas/reports/search-term-report.schema";

/**
 * RULE 002: Broad Keyword Converting but Spend Increasing
 * Indicators: Broad keyword generating sales, ACOS acceptable, spend rising
 * Action: Add Phrase + Exact version, Increase 10% budget + 20% bid on exact
 */
export class BroadKeywordScalingRule extends BaseRule implements ICampaignRuleDecision {
  private term:SearchTermDocument[]

  // private acosTarget: number;
  // private spendIncreaseThreshold: number; // Week-over-week increase
  // constructor(acosTarget: number = 0.30, spendIncreaseThreshold: number = 0.2) {
  //   this.acosTarget = acosTarget;
  //   this.spendIncreaseThreshold = spendIncreaseThreshold;
  // }

  constructor(bundle: ICampaignBundle) {
    super(bundle);
    this.term = this.getSearchTerms(MatchType.BROAD)
  }

  shouldApply(): boolean {
    if (this.campaign.targetingType !== Type.MANUAL) return false;
    if (!this.metrics) return false;

    // const broadKeywords = this.searchTerms.filter(st => 
    //   st.searchTerm.endsWith('(broad)') || st.searchTerm.includes('broad')
    // );
    const hasConverting = this.term.some(st =>  this.isConvertable(st));
    return hasConverting;
  }

  isConvertable(st){
    return st.sales7d > 0 &&  this.calculateACOS(st) <= config.targetAcos
  }
  execute(): AdjustmentLog {
    // change can be in keyword only
    // const broadKeywords = this.searchTerms.filter(st => 
    //   (st.searchTerm.endsWith('(broad)') || st.searchTerm.includes('broad')) &&
    //   st.sales7d > 0 && 
    //   this.calculateACOS(st) <= config.targetAcos
    // );
    
    const exactKeyword = this.keywords.filter(k=>k.matchType = MatchType.EXACT)
    const converting = this.term.filter((st)=>this.isConvertable(st))

        return {
      ruleId: 'KEYWORD_MGMT_002',
      ruleName: 'Scale Broad Keywords with Exact/Phrase Variants',
      campaignId: this.campaign.campaignId,
      campaignName: this.campaign.name,
      adjustments:[
        {
          action:EAction.ADD_PHRASE,
          target: ETarget.TERMS
        },
        {
          action:EAction.INCREASE_BUDGET,
          change:10
        },
        {
          action:EAction.INCREASE_BID,
          change:20,
          target:ETarget.KEYWORDS
        }
      ],
      keywords:exactKeyword,
      searchTerms:converting,
      // adjustments: {
      //   budgetChange: 10,
      //   bidChanges: [
      //     { targetingType: TargetingType.BROAD_MATCH, change: 0 }, // Keep unchanged
      //     { targetingType: TargetingType.PHRASE_MATCH, change: 20 }, // New phrase variants
      //     { targetingType: TargetingType.EXACT_MATCH, change: 20 }, // New exact variants
      //   ],
      //   action: 'INCREASE',
      // },
      reasoning:
        `${exactKeyword.length} broad keywords converting with acceptable ACOS. ` +
        `Strategy: Keep broad keywords at current bid, add Phrase and Exact match variants. ` +
        `Increase budget 10% and bid 20% on new Phrase/Exact matches to capture high-intent traffic.`,
      // estimatedImpact: {
      //   estimatedSpend: broadKeywords.reduce((sum, kw) => sum + kw.spend, 0) * 1.3,
      //   estimatedSales: broadKeywords.reduce((sum, kw) => sum + kw.sales7d, 0) * 1.8,
      // },
    };
  }
}
