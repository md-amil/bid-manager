import { AutoCampaignAdjustment, ICampaignBundle, ICampaignRuleDecision, TargetingType } from "src/engine/interfaces";
import AutoCampaignBaseRule, { config } from "../../base.rule";
import { AdjustmentLog, EAction, ETarget } from "src/schemas/log.schema";

export class ComplementaryTargetingOptimizationRule extends AutoCampaignBaseRule implements ICampaignRuleDecision {
   constructor (bundle:ICampaignBundle){
    super(bundle)
  }
  
  shouldApply(): boolean {
    const complementaryTerms = this.getSearchTerms(TargetingType.COMPLEMENTS);
    // console.log(complementaryTerms, 'complementaryTerms')
    return complementaryTerms.length > 0;
  }

   execute(): AdjustmentLog {
    const complementaryTerms = this.getSearchTerms(TargetingType.COMPLEMENTS);
    const genuineComplements = complementaryTerms.filter(
      st => this.calculateACOS(st) <= config.targetAcos
    );
    const lowRelevance = complementaryTerms.filter(st =>  this.calculateACOS(st) > config.targetAcos);

    let action= EAction.INCREASE_BID;
    let change = 0;

    if (genuineComplements.length > 0) {
      action = EAction.INCREASE_BID;
      change = 25;
    } else if (lowRelevance.length > complementaryTerms.length * 0.5) {
      action =  EAction.DECREASE_BID;
      change = -50;
    }
    const targetings =  this.getTargeting(TargetingType.COMPLEMENTS)

    return {
      ruleId: 'RULE_009',
      ruleName: 'Complementary Targeting Optimization',
      campaignId: this.campaign.campaignId,
      adjustments:[
        {
          target:ETarget.TARGETING,
          action,
          change
        }
      ],
      targetings:targetings,
      reasoning:
        `Complementary targeting analysis: ${genuineComplements.length} genuine complements found. ` +
        `${action ===EAction.INCREASE_BID ? 'Increasing' : 'Decreasing'} bids by ${Math.abs(change)}%.`,
    };
 }
}