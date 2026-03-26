import { AutoCampaignAdjustment, ICampaignBundle, ICampaignRuleDecision, TargetingType } from "src/engine/interfaces";
import BaseRule, { config } from "../../base.rule";
import { Adjustment, AdjustmentLog, EAction, ETarget } from "src/schemas/log.schema";

export class SubstituteTargetingOptimizationRule extends BaseRule implements ICampaignRuleDecision {
  constructor(bundle: ICampaignBundle) {
    super(bundle)
  }

  shouldApply(): boolean {
    const substituteTerms = this.getSearchTerms(TargetingType.SUBSTITUTES);
    console.log(substituteTerms, 'substituteTerms')
    return substituteTerms.length > 0;
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
    const substituteTerms = this.getSearchTerms(TargetingType.SUBSTITUTES);
    const competitiveWins = substituteTerms.filter(
      st => this.calculateACOS(st) <= config.targetAcos
    );
    const poor = substituteTerms.filter(
      st => st.clicks > config.minClicks && st.sales7d === 0
    );

    const adjustment = this.getAdjustment(competitiveWins, poor)

    return {
      ruleId: 'RULE_008',
      ruleName: 'Substitute Targeting Optimization',
      campaignId: this.campaign.campaignId,
      adjustments: [adjustment],
      targetings: this.getTarget(),
      reasoning:
        `Substitute targeting analysis: ${competitiveWins.length} competitive wins detected. ` +
        `${adjustment.action ===EAction.INCREASE_BID ? 'Increasing' : 'Decreasing'} bids by ${Math.abs(adjustment.change!)}%.`,
    };
  }

  private getAdjustment(rich, poor): Adjustment {
    if (rich.length > 0) {
      return {
        action: EAction.INCREASE_BID,
        target: ETarget.TARGETING,
        change: 25
      }
    }
    return {
      action: EAction.DECREASE_BID,
      target: ETarget.TARGETING,
      change: -50
    }

    // let action: 'INCREASE' | 'DECREASE' | 'CONTROL' = 'CONTROL';
    // let change = 0;

    // if (rich.length > 0) {
    //   action = 'INCREASE';
    //   change = 25;
    // } else if (poor.length > 0) {
    //   action = 'DECREASE';
    //   change = -50;
    // }
  }
}
