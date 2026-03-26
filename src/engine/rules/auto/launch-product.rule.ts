import { AdjustmentLog, EAction, ETarget } from "src/schemas/log.schema";
import {  ICampaignBundle, ICampaignRuleDecision } from "../../interfaces";
import BaseRule, { config } from "../base.rule";

export class NewProductLaunchRule extends BaseRule implements ICampaignRuleDecision {
  constructor(bundle: ICampaignBundle) {
    super(bundle)
  }

  shouldApply(): boolean {
    return this.isLaunchPhase
    // console.log(`cost ${this.cost} and clicks ${this.clicks}, term length ${this.searchTerms.length} sales ${this.sales}`)
    // if (this.cost < config.minSpend) return true
    // return this.searchTerms.length == 0 && this.clicks <= config.minClicks && this.sales == 0
  }

  execute(): AdjustmentLog {
  
    const targetings = this.getTargeting()
    return {
      ruleId: 'RULE_002',
      ruleName: 'New Product Launch Phase',
      campaignId: this.campaign.campaignId,
      adjustments: [{
        action: EAction.SUGGESTED,
        target: ETarget.TARGETING
      }],
      targetings,
      reasoning:
        `New ASIN with no keyword data and no ranking history detected.` +
        `Enabling all four auto targeting types (Close, Loose, Substitute, Complementary)` +
        `with suggested bids to discover relevant traffic for new product.`,
    };
  }
}

