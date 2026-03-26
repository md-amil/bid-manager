import { AutoCampaignAdjustment, ICampaignBundle, ICampaignRuleDecision, TargetingType } from "src/engine/interfaces";
import AutoCampaignBaseRule, { config } from "../../base.rule";
import BaseRule from "../../base.rule";
import { AdjustmentLog, EAction, ETarget } from "src/schemas/log.schema";

export class LooseMatchOptimizationRule extends BaseRule implements ICampaignRuleDecision {
  constructor(bundle: ICampaignBundle) {
    super(bundle)
  }

  shouldApply(): boolean {
    const looseMatchTerms = this.getSearchTerms(TargetingType.LOOSE_MATCH);
    console.log({ looseMatchTerms })
    return looseMatchTerms.length > 0;
  }

  execute(): AdjustmentLog {
    const looseMatchTerms = this.getSearchTerms(TargetingType.LOOSE_MATCH);
    const goodCTRLowCPC = looseMatchTerms.filter(st => this.calculateCTR(st) > 1 && this.calculateCPC(st) < 2);
    const genericTraffic = looseMatchTerms.filter(st => this.calculateACOS(st) > config.targetAcos * 2);
    console.log({ goodCTRLowCPC },)
    console.log({ genericTraffic },)

    let action: EAction = EAction.INCREASE_BID;
    let change = 0;
    if (goodCTRLowCPC.length > 0) {
      action = EAction.INCREASE_BID;
      change = 20;
    } else if (genericTraffic.length > looseMatchTerms.length * 0.5) {
      action = EAction.DECREASE_BID;
      change = -50;
    }

    const looseTargeting = this.getTargeting(TargetingType.LOOSE_MATCH)

    return {
      ruleId: 'RULE_007',
      ruleName: 'Loose Match Targeting Optimization',
      campaignId: this.campaign.campaignId,
      adjustments: [
        { target: ETarget.TARGETING, change, action }],
      targetings: looseTargeting,
      reasoning:
        `Loose Match targeting analysis: ${goodCTRLowCPC.length} terms with good CTR/low CPC. ` +
        `${action === EAction.INCREASE_BID ? 'Increasing' : 'Decreasing'} bids by ${Math.abs(change)}%.`,
    };
  }
}