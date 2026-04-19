import { AutoCampaignAdjustment, ICampaignBundle, ICampaignRuleDecision, TargetingType } from "src/engine/interfaces";
import AutoCampaignBaseRule, { config, TargetType } from "../../base.rule";
import BaseRule from "../../base.rule";
import { AdjustmentLog, EAction, ETarget } from "src/schemas/log.schema";
import { Targeting } from "src/interfaces/report.type";

export class LooseMatchOptimizationRule extends BaseRule implements ICampaignRuleDecision {
  private targeting: Targeting
  private isGoodBroadExp: boolean
  private isGeneric: boolean
  // private goodTargets: any[];
  // private poorTargets: any[];

  constructor(bundle: ICampaignBundle) {
    super(bundle)
    this.targeting = this.getTargeting(TargetType.LOOSE_MATCH)[0];
    if(!this.targeting.metrics) return 
    const { cost, clicks, sales } = this.targeting.metrics;
    const ctr = this.calculateCTR(this.targeting.metrics);
    const cpc = this.calculateCPC(this.targeting.metrics);
    this.isGoodBroadExp = ctr > 0.5 && cpc < 2; // decent CTR (>0.5%) and low CPC (<$2)
    this.isGeneric = this.calculateACOS({ cost, sales }) > config.targetAcos

    // Increase 20% when: Low CPC and decent CTR (good for broad keyword exploration)
    // this.goodTargets = looseMatchTargets.filter(target => {
    //   const ctr = this.calculateCTR(target.metrics);
    //   const cpc = this.calculateCPC(target.metrics);
    //   return ctr > 0.5 && cpc < 2; // decent CTR (>0.5%) and low CPC (<$2)
    // });

    // // Decrease 50% when: ACOS is consistently high (traffic too generic)
    // this.poorTargets = looseMatchTargets.filter(target => {
    //   const acos = target.metrics.sales > 0 ? target.metrics.cost / target.metrics.sales : Infinity;
    //   return acos > config.targetAcos * 2; // ACOS > 40% (double target)
    // });
  }

  shouldApply(): boolean {
    if(!this.targeting.metrics) return false;
    const lowImpTarget = this.getLowImpressionTarget();
        const isLowImpression = lowImpTarget.length && lowImpTarget.some(target => target.targetId == this.targeting.targetId);
    if (isLowImpression) return false;
    return (this.isGeneric || this.isGoodBroadExp);
  }

  execute(): AdjustmentLog {
    let action: EAction;
    let change: number;

    // Increase 20% when: Low CPC and decent CTR (good for broad keyword exploration)
    if (this.isGoodBroadExp) {
      action = EAction.INCREASE_BID;
      change = 20;
    }
    else if (this.isGeneric) {
      action = EAction.DECREASE_BID;
      change = -50;
    }
    // Decrease 50% when: ACOS is consistently high (traffic too generic)
    else {
      action = EAction.NA;
      change = 0
    }

    const looseTargeting = this.getTargeting(TargetType.LOOSE_MATCH)

    return {
      ruleId: 'RULE_007',
      ruleName: 'Loose Match Targeting Optimization',
      campaignId: this.campaign.campaignId,
      campaignName: this.campaign.name,
      adjustments: [
        { target: ETarget.TARGETING, change, action }
      ],
      targetings: looseTargeting.map(t => ({
        targetId: t.targetId,
        targetingType: t.metrics.targeting,
        expression: t.expression[0].type || '',
        bid: t.bid
      })),
      reasoning:
        `Loose Match (Best for: Broad keyword exploration): ${this.isGoodBroadExp} targets with good CTR/low CPC. ` +
        `${action === EAction.INCREASE_BID ? 'Increasing' : 'Decreasing'} bids by ${Math.abs(change)}%.`,
    };
  }
}