import { AutoCampaignAdjustment, TargetingType, ICampaignBundle, ICampaignRuleDecision } from "../../interfaces";
import BaseRule, { config } from "../base.rule";

export class NewProductLaunchRule extends BaseRule implements ICampaignRuleDecision {
   constructor (bundle:ICampaignBundle){
    super(bundle)
  }
  
  shouldApply(): boolean {
    if(this.spend < config.minSpend) return true
    return this.searchTerms.length == 0 && this.clicks <= config.minClicks && this.sales == 0
  }

  execute(): AutoCampaignAdjustment {

    
    const allTargetingTypes = [
      TargetingType.CLOSE_MATCH,
      TargetingType.LOOSE_MATCH,
      TargetingType.SUBSTITUTES,
      TargetingType.COMPLEMENTS,
    ];

    return {
      ruleId: 'RULE_002',
      ruleName: 'New Product Launch Phase',
      campaignId: this.campaign.campaignId,
      adjustments: {
        bidChanges: allTargetingTypes.map(targetingType => ({
          targetingType,
          change: 0,
        })),
        action: 'CONTROL',
      },
      reasoning:
        `New ASIN with no keyword data and no ranking history detected.` +
        `Enabling all four auto targeting types (Close, Loose, Substitute, Complementary)` +
        `with suggested bids to discover relevant traffic for new product.`,
    };
  }
}