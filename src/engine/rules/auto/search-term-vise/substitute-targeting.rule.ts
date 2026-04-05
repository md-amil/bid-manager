import { ICampaignBundle, ICampaignRuleDecision, TargetingType } from "src/engine/interfaces";
import BaseRule, { config, TargetType } from "../../base.rule";
import { AdjustmentLog, EAction, ETarget } from "src/schemas/log.schema";
import { Targeting } from "src/interfaces/report.type";

export class SubstituteTargetingOptimizationRule extends BaseRule implements ICampaignRuleDecision {
  private competitiveWins: any[];
  private poorPerformers: any[];
  private targeting: Targeting[];

  constructor(bundle: ICampaignBundle) {
    super(bundle)
    // Get SUBSTITUTES targeting with metrics
    this.targeting = this.getTargeting(TargetType.SUBSTITUTES);
    if(!this.targeting[0].metrics) return
    // Increase 25% when: Sales coming from competitor listings AND Price and reviews are competitive
    this.competitiveWins = this.targeting.filter(target => {
      const acos = target.metrics.sales > 0 ? target.metrics.cost / target.metrics.sales : Infinity;
      return target.metrics.sales > 0 && acos <= config.targetAcos;
    });

    // Decrease 50% when: High clicks, low sales, high ACOS OR Weak competitive positioning
    this.poorPerformers = this.targeting.filter(target => {
      const acos = target.metrics.sales > 0 ? target.metrics.cost / target.metrics.sales : Infinity;
      return (target.metrics.clicks > config.minClicks && target.metrics.sales === 0) ||
        (target.metrics.sales > 0 && acos > config.targetAcos);
    });
  }

  shouldApply(): boolean {
    const lowImpTarget = this.getLowImpressionTarget();
    const isLowImpression = lowImpTarget.length && lowImpTarget.some(target => target.targetId == this.targeting[0].targetId);
    if (!this.targeting[0].metrics || isLowImpression) return false;
    return (this.competitiveWins.length > 0 || this.poorPerformers.length > 0);
  }

  execute(): AdjustmentLog {
    let action: EAction;
    let change: number;

    // Increase 25% when: Sales from competitor listings AND competitive ACOS
    if (this.competitiveWins.length > 0) {
      action = EAction.INCREASE_BID;
      change = 25;
    }
    // Decrease 50% when: High clicks/low sales/high ACOS OR weak competitive positioning
    else {
      action = EAction.DECREASE_BID;
      change = -50;
    }


      return {
      ruleId: 'RULE_008',
      ruleName: 'Substitute Targeting Optimization',
      campaignId: this.campaign.campaignId,
      campaignName: this.campaign.name,
      adjustments: [{
        action,
        target: ETarget.TARGETING,
        change
      }],
      targetings: this.targeting.map(t => ({
        targetId: t.targetId,
        targetingType: t.metrics.targeting,
        expression: t.expression[0].type || '',
        bid: t.bid
      })),
      reasoning:
        `Substitutes (Best for: Competitor ASIN targeting): ${this.competitiveWins.length} targets with sales from competitors at competitive ACOS. ` +
        `${this.poorPerformers.length} targets with weak positioning (high clicks/low sales). ` +
        `${action === EAction.INCREASE_BID ? 'Increasing' : 'Decreasing'} bids by ${Math.abs(change)}%.`,
    };
  }
}
