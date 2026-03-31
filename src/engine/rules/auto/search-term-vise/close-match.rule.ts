import { AutoCampaignAdjustment, ICampaignBundle, ICampaignRuleDecision, TargetingType } from "src/engine/interfaces";
import AutoCampaignBaseRule, { config } from "../../base.rule";
import { AdjustmentLog, EAction, ETarget } from "src/schemas/log.schema";
import BaseRule from "../../base.rule";
import { SearchTermDocument } from "src/schemas/reports/search-term-report.schema";

export class CloseMatchOptimizationRule extends BaseRule implements ICampaignRuleDecision {
  private goodTerms: SearchTermDocument[];
  private poorTerms: SearchTermDocument[];

  constructor(bundle: ICampaignBundle) {
    super(bundle)
    const closeMatchTerms = this.getSearchTerms(TargetingType.CLOSE_MATCH);
    // Increase 20% when: Converting search terms found AND ACOS is acceptable
    this.goodTerms = closeMatchTerms.filter(st => st.sales7d > 0 && this.calculateACOS(st) <= config.targetAcos);
    // Decrease 50% when: Spending 300+ with no sales OR ACOS is not acceptable
    this.poorTerms = closeMatchTerms.filter(st =>
      (st.cost >= config.minSpend && st.sales7d === 0) ||
      (st.sales7d > 0 && this.calculateACOS(st) > config.targetAcos)
    );
  }

  shouldApply(): boolean {
    return (this.goodTerms.length > 0 || this.poorTerms.length > 0);
  }


  execute(): AdjustmentLog {
    let action: EAction;
    let change: number;

    // Increase 20% when: Converting search terms found AND ACOS is acceptable
    if (this.goodTerms.length > 0) {
      action = EAction.INCREASE_BID;
      change = 20;
    }
    // Decrease 50% when: Spending 300+ with no sales OR ACOS is not acceptable
    else {
      action = EAction.DECREASE_BID;
      change = -50;
    }

    const targetings = this.getTargeting(TargetingType.CLOSE_MATCH)

    return {
      ruleId: 'RULE_006',
      ruleName: 'Close Match Targeting Optimization',
      campaignId: this.campaign.campaignId,
      adjustments: [
        {
          action,
          change,
          target: ETarget.TARGETING
        }
      ],
      targetings,
      reasoning:
        `Close Match (Best for: High-intent discovery): ${this.goodTerms.length} converting terms with acceptable ACOS. ` +
        `${action === EAction.INCREASE_BID ? 'Increasing' : 'Decreasing'} bids by ${Math.abs(change)}%.`,
    };
  }
}
