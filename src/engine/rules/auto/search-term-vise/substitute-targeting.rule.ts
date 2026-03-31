import { AutoCampaignAdjustment, ICampaignBundle, ICampaignRuleDecision, TargetingType } from "src/engine/interfaces";
import BaseRule, { config } from "../../base.rule";
import { Adjustment, AdjustmentLog, EAction, ETarget } from "src/schemas/log.schema";

export class SubstituteTargetingOptimizationRule extends BaseRule implements ICampaignRuleDecision {
  private competitiveWins: any[];
  private poorPerformers: any[];

  constructor(bundle: ICampaignBundle) {
    super(bundle)
    const substituteTerms = this.getSearchTerms(TargetingType.SUBSTITUTES);
    // Increase 25% when: Sales coming from competitor listings AND Price and reviews are competitive
    this.competitiveWins = substituteTerms.filter(st =>
      st.sales7d > 0 && this.calculateACOS(st) <= config.targetAcos
    );
    // Decrease 50% when: High clicks, low sales, high ACOS OR Weak competitive positioning
    this.poorPerformers = substituteTerms.filter(st =>
      (st.clicks > config.minClicks && st.sales7d === 0) ||
      (st.sales7d > 0 && this.calculateACOS(st) > config.targetAcos)
    );
  }

  shouldApply(): boolean {
    return (this.competitiveWins.length > 0 || this.poorPerformers.length > 0);
  }
   getTarget(){
    const targetings = this.getTargeting(TargetingType.SUBSTITUTES)
    return targetings.map(t=>({
      targetingId: t.targetId,
      targetingType: t.expressionType,
      expression: t.expression,
      bid:t.bid
    }))
  }

  execute(): AdjustmentLog {
    let action: EAction;
    let change: number;

    // Increase 25% when: Sales coming from competitor listings AND Price and reviews are competitive
    if (this.competitiveWins.length > 0) {
      action = EAction.INCREASE_BID;
      change = 25;
    }
    // Decrease 50% when: High clicks, low sales, high ACOS OR Weak competitive positioning
    else {
      action = EAction.DECREASE_BID;
      change = -50;
    }

    return {
      ruleId: 'RULE_008',
      ruleName: 'Substitute Targeting Optimization',
      campaignId: this.campaign.campaignId,
      adjustments: [{
        action,
        target: ETarget.TARGETING,
        change
      }],
      targetings: this.getTarget(),
      reasoning:
        `Substitutes (Best for: Competitor ASIN targeting): ${this.competitiveWins.length} competitive wins detected. ` +
        `${action === EAction.INCREASE_BID ? 'Increasing' : 'Decreasing'} bids by ${Math.abs(change)}%.`,
    };
  }
}
