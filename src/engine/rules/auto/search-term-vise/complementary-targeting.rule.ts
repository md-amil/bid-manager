import { AutoCampaignAdjustment, ICampaignBundle, ICampaignRuleDecision, TargetingType } from "src/engine/interfaces";
import AutoCampaignBaseRule, { config } from "../../base.rule";

export class ComplementaryTargetingOptimizationRule extends AutoCampaignBaseRule implements ICampaignRuleDecision {
  
   constructor (bundle:ICampaignBundle){
    super(bundle)
  }
  
  shouldApply(): boolean {
    const complementaryTerms = this.getSearchTerms(TargetingType.COMPLEMENTS);
    return complementaryTerms.length > 0;
  }

  execute(): AutoCampaignAdjustment {
    const complementaryTerms = this.getSearchTerms(TargetingType.COMPLEMENTS);
    const genuineComplements = complementaryTerms.filter(
      st => this.calculateACOS(st) <= config.targetAcos
    );
    const lowRelevance = complementaryTerms.filter(st =>  this.calculateACOS(st) > config.targetAcos);

    let action: 'INCREASE' | 'DECREASE' | 'CONTROL' = 'CONTROL';
    let change = 0;

    if (genuineComplements.length > 0) {
      action = 'INCREASE';
      change = 25;
    } else if (lowRelevance.length > complementaryTerms.length * 0.5) {
      action = 'DECREASE';
      change = -50;
    }

    return {
      ruleId: 'RULE_009',
      ruleName: 'Complementary Targeting Optimization',
      campaignId: this.campaign.campaignId,
      adjustments: {
        bidChanges: [{ targetingType: TargetingType.COMPLEMENTS, change }],
        action,
      },
      reasoning:
        `Complementary targeting analysis: ${genuineComplements.length} genuine complements found. ` +
        `${action === 'INCREASE' ? 'Increasing' : 'Decreasing'} bids by ${Math.abs(change)}%.`,
    };
 }
}