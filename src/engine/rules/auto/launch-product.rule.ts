import { AdjustmentLog, EAction, ETarget } from "src/schemas/log.schema";
import { ICampaignBundle, ICampaignRuleDecision, TargetingType } from "../../interfaces";
import BaseRule, { config } from "../base.rule";

export class NewProductLaunchRule extends BaseRule implements ICampaignRuleDecision {
  constructor(bundle: ICampaignBundle) {
    super(bundle)
  }

  shouldApply(): boolean {
    // increaase bid if budget not utilized
    return this.isLaunchPhase
    // console.log(`cost ${this.cost} and clicks ${this.clicks}, term length ${this.searchTerms.length} sales ${this.sales}`)
    // if (this.cost < config.minSpend) return true
    // return this.searchTerms.length == 0 && this.clicks <= config.minClicks && this.sales == 0
  }

  getAdjustment() {
    const budgetNotFullyUtilized = this.utilization < config.budgetUtilizationThreshold;
    if (budgetNotFullyUtilized) return {
      action: EAction.INCREASE_BID,
      change: 25,
      target: ETarget.TARGETING
    }
    return {
      action: EAction.SUGGESTED,
      target: ETarget.TARGETING
    }
  }

  execute(): AdjustmentLog {
    const allTargetingTypes = [
      TargetingType.CLOSE_MATCH,
      TargetingType.LOOSE_MATCH,
      TargetingType.SUBSTITUTES,
      TargetingType.COMPLEMENTS
    ];
    const targetings = this.getTargeting(allTargetingTypes);


    return {
      ruleId: 'RULE_002',
      ruleName: 'New Product Launch Phase',
      campaignId: this.campaign.campaignId,
      adjustments: [this.getAdjustment()],
      targetings,
      reasoning:
        `New ASIN with no keyword data and no ranking history detected. ` +
        `Running auto campaign with suggested bids using all four auto targeting types ` +
        `(Close Match, Loose Match, Substitute, and Complementary) for traffic discovery.`,
    };
  }
}

