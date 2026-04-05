import { ICampaignBundle, ICampaignRuleDecision, TargetingType } from "src/engine/interfaces";
import BaseRule, { config, TargetType } from "../../base.rule";
import { AdjustmentLog, EAction, ETarget } from "src/schemas/log.schema";
import { Targeting } from "src/interfaces/report.type";

export class ComplementaryTargetingOptimizationRule extends BaseRule implements ICampaignRuleDecision {
  private isGenuineComplement: boolean;
  private lowRelevance: any[];
  private targeting: Targeting;

  constructor(bundle: ICampaignBundle) {
    super(bundle)
    // Get COMPLEMENTS targeting with metrics
    this.targeting = this.getTargeting(TargetType.COMPLEMENTS)[0];

    // Increase 25% when: Products are genuinely complementary AND Incremental sales observed
    // this.isGenuineComplement =this.calculateACOS({cost:}) this.targeting.metrics.sales > 0 && this.targeting.metrics.acos <= config.targetAcos;
    // this.genuineComplements = this.targeting.filter(target => {
    //   const acos = target.metrics.sales > 0 ? target.metrics.cost / target.metrics.sales : Infinity;
    //   return target.metrics.sales > 0 && acos <= config.targetAcos;
    // });

    // Decrease 50% when: Low relevance OR Poor sales, high ACOS
    // this.lowRelevance = this.targeting.filter(target => {
    //   const acos = target.metrics.sales > 0 ? target.metrics.cost / target.metrics.sales : Infinity;
    //   return target.metrics.sales === 0 || acos > config.targetAcos;
    // });
  }

  shouldApply(): boolean {
    if(!this.targeting.metrics) return false;
    const lowImpTarget = this.getLowImpressionTarget();
    const isLowImpression = lowImpTarget.length && lowImpTarget.some(target => target.targetId == this.targeting.targetId);
    if ( isLowImpression) return false;

    const {cost,sales} = this.targeting.metrics;
    const isGenuineComplement = this.calculateACOS({cost: cost, sales7d: sales}) <= config.targetAcos;
    const lowRelevence =  this.calculateACOS({cost: cost, sales7d: sales}) > config.targetAcos;
    return isGenuineComplement || lowRelevence;
  }

  execute(): AdjustmentLog {
    let action: EAction;
    let change: number;
    const {cost,sales} = this.targeting.metrics;
     const isGenuineComplement = this.calculateACOS({cost: cost, sales7d: sales}) <= config.targetAcos;
    const lowRelevence =  this.calculateACOS({cost: cost, sales7d: sales}) > config.targetAcos;

    // Increase 25% when: Products genuinely complementary with incremental sales
    if (isGenuineComplement) {
      action = EAction.INCREASE_BID;
      change = 25;
    }
    else if (lowRelevence) {
      action = EAction.DECREASE_BID;
      change = -50;
    }
    else {
      action = EAction.NA;
      change = 0;
    }

    const { targetId, metrics, expression, bid } = this.targeting;

    return {
      ruleId: 'RULE_009',
      ruleName: 'Complementary Targeting Optimization',
      campaignId: this.campaign.campaignId,
      campaignName: this.campaign.name,
      adjustments: [{
        target: ETarget.TARGETING,
        action,
        change
      }],
      targetings:[{
        targetId,
        targetingType: metrics.targeting,
        expression: expression[0].type,
        bid
      }],
      reasoning:
        `Complements (Best for: Cross-selling opportunities): ${isGenuineComplement} targets with genuine complementary sales. ` +
        `${lowRelevence} targets with low relevance (no sales/high ACOS). ` +
        `${action === EAction.INCREASE_BID ? 'Increasing' : 'Decreasing'} bids by ${Math.abs(change)}%.`,
    };
  }
}