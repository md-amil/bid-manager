import { AutoCampaignAdjustment, ICampaignBundle, ICampaignRuleDecision, TargetingType } from "src/engine/interfaces";
import AutoCampaignBaseRule, { config } from "../../base.rule";
import BaseRule from "../../base.rule";
import { AdjustmentLog, EAction, ETarget } from "src/schemas/log.schema";

export class LooseMatchOptimizationRule extends BaseRule implements ICampaignRuleDecision {
  private goodTerms: any[];
  private poorTerms: any[];

  constructor(bundle: ICampaignBundle) {
    super(bundle)
    const looseMatchTerms = this.getSearchTerms(TargetingType.LOOSE_MATCH);
    // Increase 20% when: Looking to expand reach during new product launch OR Low CPC and decent CTR
    this.goodTerms = looseMatchTerms.filter(st =>
      this.calculateCTR(st) > 1 && this.calculateCPC(st) < 2
    );
    // Decrease 50% when: Traffic is too generic OR ACOS is consistently high
    this.poorTerms = looseMatchTerms.filter(st =>
      this.calculateACOS(st) > config.targetAcos * 2
    );
    // console.log('Total Terms', looseMatchTerms)
    // console.log('Good Terms', this.goodTerms)
    // console.log('Poor Terms', this.poorTerms)
  }

  shouldApply(): boolean {
    return (this.goodTerms.length > 0 || this.poorTerms.length > 0);
  }

  execute(): AdjustmentLog {
    let action: EAction;
    let change: number;

    // Increase 20% when: Looking to expand reach during new product launch OR Low CPC and decent CTR
    if (this.goodTerms.length > 0) {
      action = EAction.INCREASE_BID;
      change = 20;
    }
    // Decrease 50% when: Traffic is too generic OR ACOS is consistently high
    else {
      action = EAction.DECREASE_BID;
      change = -50;
    }

    const looseTargeting = this.getTargeting(TargetingType.LOOSE_MATCH)

    return {
      ruleId: 'RULE_007',
      ruleName: 'Loose Match Targeting Optimization',
      campaignId: this.campaign.campaignId,
      adjustments: [
        { target: ETarget.TARGETING, change, action }
      ],
      targetings: looseTargeting,
      reasoning:
        `Loose Match (Best for: Broad keyword exploration): ${this.goodTerms.length} terms with good CTR/low CPC. ` +
        `${action === EAction.INCREASE_BID ? 'Increasing' : 'Decreasing'} bids by ${Math.abs(change)}%.`,
    };
  }
}