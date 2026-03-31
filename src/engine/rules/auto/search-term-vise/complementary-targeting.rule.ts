import { AutoCampaignAdjustment, ICampaignBundle, ICampaignRuleDecision, TargetingType } from "src/engine/interfaces";
import AutoCampaignBaseRule, { config } from "../../base.rule";
import { AdjustmentLog, EAction, ETarget } from "src/schemas/log.schema";

export class ComplementaryTargetingOptimizationRule extends AutoCampaignBaseRule implements ICampaignRuleDecision {
  private genuineComplements: any[];
  private lowRelevance: any[];

  constructor(bundle: ICampaignBundle) {
    super(bundle)
    const complementaryTerms = this.getSearchTerms(TargetingType.COMPLEMENTS);
    // Increase 25% when: Products are genuinely complementary AND Incremental sales observed
    this.genuineComplements = complementaryTerms.filter(st =>
      st.sales7d > 0 && this.calculateACOS(st) <= config.targetAcos
    );
    // Decrease 50% when: Low relevance OR Poor sales, high ACOS
    this.lowRelevance = complementaryTerms.filter(st =>
      st.sales7d === 0 || this.calculateACOS(st) > config.targetAcos
    );
  }

  shouldApply(): boolean {
    return (this.genuineComplements.length > 0 || this.lowRelevance.length > 0);
  }

  execute(): AdjustmentLog {
    let action: EAction;
    let change: number;

    // Increase 25% when: Products are genuinely complementary AND Incremental sales observed
    if (this.genuineComplements.length > 0) {
      action = EAction.INCREASE_BID;
      change = 25;
    }
    // Decrease 50% when: Low relevance OR Poor sales, high ACOS
    else {
      action = EAction.DECREASE_BID;
      change = -50;
    }

    const targetings = this.getTargeting(TargetingType.COMPLEMENTS)

    return {
      ruleId: 'RULE_009',
      ruleName: 'Complementary Targeting Optimization',
      campaignId: this.campaign.campaignId,
      adjustments: [
        {
          target: ETarget.TARGETING,
          action,
          change
        }
      ],
      targetings: targetings,
      reasoning:
        `Complements (Best for: Cross-selling opportunities): ${this.genuineComplements.length} genuine complements found. ` +
        `${action === EAction.INCREASE_BID ? 'Increasing' : 'Decreasing'} bids by ${Math.abs(change)}%.`,
    };
  }
}