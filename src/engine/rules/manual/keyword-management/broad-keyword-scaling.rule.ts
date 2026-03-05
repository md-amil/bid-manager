import { AutoCampaignAdjustment, ICampaignBundle, ICampaignRuleDecision, TargetingType } from "src/engine/interfaces";
import BaseRule, { config } from "../../base.rule";
import { Type } from "src/schemas/campaign.schema";

/**
 * RULE 002: Broad Keyword Converting but Spend Increasing
 * Indicators: Broad keyword generating sales, ACOS acceptable, spend rising
 * Action: Keep broad at lower bid, Add Phrase + Exact version, Increase 10% budget + 20% bid on exact
 */
export class BroadKeywordScalingRule extends BaseRule implements ICampaignRuleDecision {
  // private acosTarget: number;
  // private spendIncreaseThreshold: number; // Week-over-week increase

  // constructor(acosTarget: number = 0.30, spendIncreaseThreshold: number = 0.2) {
  //   this.acosTarget = acosTarget;
  //   this.spendIncreaseThreshold = spendIncreaseThreshold;
  // }

  constructor(bundle: ICampaignBundle) {
    super(bundle);
  }

  shouldApply(): boolean {
    if (this.campaign.targetingType !== Type.MANUAL) return false;
    if (!this.metrics) return false;

    const broadKeywords = this.searchTerms.filter(st => 
      st.searchTerm.endsWith('(broad)') || st.searchTerm.includes('broad')
    );

    const hasConverting = broadKeywords.some(st => 
      st.sales7d > 0 &&  this.calculateACOS(st) <= config.targetAcos
    );

    return hasConverting;
  }

  execute(): AutoCampaignAdjustment {
    const broadKeywords = this.searchTerms.filter(st => 
      (st.searchTerm.endsWith('(broad)') || st.searchTerm.includes('broad')) &&
      st.sales7d > 0 && 
      this.calculateACOS(st) <= config.targetAcos
    );

    return {
      ruleId: 'KEYWORD_MGMT_002',
      ruleName: 'Scale Broad Keywords with Exact/Phrase Variants',
      campaignId: this.campaign.campaignId,
      adjustments: {
        budgetChange: 10,
        bidChanges: [
          { targetingType: TargetingType.BROAD_MATCH, change: 0 }, // Keep unchanged
          { targetingType: TargetingType.PHRASE_MATCH, change: 20 }, // New phrase variants
          { targetingType: TargetingType.EXACT_MATCH, change: 20 }, // New exact variants
        ],
        action: 'INCREASE',
      },
      reasoning:
        `${broadKeywords.length} broad keywords converting with acceptable ACOS. ` +
        `Strategy: Keep broad keywords at current bid, add Phrase and Exact match variants. ` +
        `Increase budget 10% and bid 20% on new Phrase/Exact matches to capture high-intent traffic.`,
      estimatedImpact: {
        estimatedSpend: broadKeywords.reduce((sum, kw) => sum + kw.spend, 0) * 1.3,
        estimatedSales: broadKeywords.reduce((sum, kw) => sum + kw.sales7d, 0) * 1.8,
      },
    };
  }
}
