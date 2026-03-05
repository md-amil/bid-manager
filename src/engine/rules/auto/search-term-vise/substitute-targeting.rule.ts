import { AutoCampaignAdjustment, ICampaignBundle, ICampaignRuleDecision, TargetingType } from "src/engine/interfaces";
import AutoCampaignBaseRule, { config } from "../../base.rule";

export class SubstituteTargetingOptimizationRule extends AutoCampaignBaseRule implements ICampaignRuleDecision {
  constructor(bundle: ICampaignBundle) {
    super(bundle)
  }

  shouldApply(): boolean {
    const substituteTerms = this.getSearchTerms(TargetingType.SUBSTITUTES);
    return substituteTerms.length > 0;
  }

  execute(): AutoCampaignAdjustment {
    const substituteTerms = this.getSearchTerms(TargetingType.SUBSTITUTES);
    const competitiveWins = substituteTerms.filter(
      st => this.calculateACOS(st) <= config.targetAcos
    );
    const poorCompetitiveMatch = substituteTerms.filter(
      st => st.clicks > config.minClicks && st.sales7d === 0
    );

    let action: 'INCREASE' | 'DECREASE' | 'CONTROL' = 'CONTROL';
    let change = 0;

    if (competitiveWins.length > 0) {
      action = 'INCREASE';
      change = 25;
    } else if (poorCompetitiveMatch.length > 0) {
      action = 'DECREASE';
      change = -50;
    }

    return {
      ruleId: 'RULE_008',
      ruleName: 'Substitute Targeting Optimization',
      campaignId: this.campaign.campaignId,
      adjustments: {
        bidChanges: [{ targetingType: TargetingType.SUBSTITUTES, change }],
        action,
      },
      reasoning:
        `Substitute targeting analysis: ${competitiveWins.length} competitive wins detected. ` +
        `${action === 'INCREASE' ? 'Increasing' : 'Decreasing'} bids by ${Math.abs(change)}%.`,
    };
  }
}
