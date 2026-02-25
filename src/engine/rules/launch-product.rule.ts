import { config } from "../core/rule.engine";
import { AutoCampaignAdjustment, AutoTargetingType, ICampaignBundle, ICampaignRuleDecision } from "../interfaces";

export class NewProductLaunchRule implements ICampaignRuleDecision {
  shouldApply(bundle: ICampaignBundle): boolean {
    const { matrics, searchTerm } = bundle
    return searchTerm.length == 0
      && matrics.clicks <= config.minClicks
      && matrics.sales7d == 0
  }

  execute(campaign: ICampaignBundle): AutoCampaignAdjustment {
    const allTargetingTypes = [
      AutoTargetingType.CLOSE_MATCH,
      AutoTargetingType.LOOSE_MATCH,
      AutoTargetingType.SUBSTITUTES,
      AutoTargetingType.COMPLEMENTS,
    ];

    return {
      ruleId: 'RULE_002',
      ruleName: 'New Product Launch Phase',
      campaignId: campaign.id,
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