import { AutoCampaignAdjustment,  ICampaignBundle,  ICampaignRuleDecision, TargetingType } from "src/engine/interfaces";
import AutoCampaignBaseRule, { config } from "../../base.rule";
import BaseRule from "../../base.rule";

export class LooseMatchOptimizationRule extends BaseRule implements ICampaignRuleDecision {
   constructor (bundle:ICampaignBundle){
      super(bundle)
    }
  
  shouldApply(): boolean {
    const looseMatchTerms = this.getSearchTerms(TargetingType.LOOSE_MATCH);
    return looseMatchTerms.length > 0;
  }

 
  execute(): AutoCampaignAdjustment {
    const looseMatchTerms =this.getSearchTerms(TargetingType.LOOSE_MATCH);
    const goodCTRLowCPC = looseMatchTerms.filter(st =>this.calculateCTR(st) > 1 && this.calculateCPC(st) < 2);
    const genericTraffic = looseMatchTerms.filter(st =>this.calculateACOS(st) > config.targetAcos * 2);

    let action: 'INCREASE' | 'DECREASE' | 'CONTROL' = 'CONTROL';
    let change = 0;

    if (goodCTRLowCPC.length > 0) {
      action = 'INCREASE';
      change = 20;
    } else if (genericTraffic.length > looseMatchTerms.length * 0.5) {
      action = 'DECREASE';
      change = -50;
    }

    return {
      ruleId: 'RULE_007',
      ruleName: 'Loose Match Targeting Optimization',
      campaignId: this.campaign.campaignId,
      adjustments: {
        bidChanges: [{ targetingType: TargetingType.LOOSE_MATCH, change }],
        action,
      },
      reasoning:
        `Loose Match targeting analysis: ${goodCTRLowCPC.length} terms with good CTR/low CPC. ` +
        `${action === 'INCREASE' ? 'Increasing' : 'Decreasing'} bids by ${Math.abs(change)}%.`,
    };
  }
}