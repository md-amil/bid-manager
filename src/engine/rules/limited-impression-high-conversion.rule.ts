// import { AutoCampaign, AutoCampaignAdjustment, AutoTargetingType, IAutoCampaignRuleDecision } from "files (2)/auto-campaign-rules";
import { AutoCampaignAdjustment, AutoTargetingType, ICampaignBundle, ICampaignRuleDecision } from "../interfaces";

// RULE 3: Good Conversion Rate with Limited Impressions
export class LimitedImpressionsHighConversionRule implements ICampaignRuleDecision {
  shouldApply(campaign: ICampaignBundle): boolean {
        const { matrics, budget } = campaign
        const { impressions, clicks, sales7d, spend } = matrics
        if (clicks == 0) return false
        const convRate = sales7d / clicks
        const budgetUtilized = budget.budget[0] > 0 ? spend / budget.budget[0] : 0;
        return convRate > 0.05 && impressions < 500 && budgetUtilized < 0.7;
  }

  execute(campaign: ICampaignBundle): AutoCampaignAdjustment {
    return {
      ruleId: 'RULE_003',
      ruleName: 'Increase Bids for Limited Impressions',
      campaignId: campaign.id,
      adjustments: {
        bidChanges: [
          { targetingType: AutoTargetingType.CLOSE_MATCH, change: 25 },
          { targetingType: AutoTargetingType.LOOSE_MATCH, change: 25 },
        ],
        action: 'INCREASE',
      },
      reasoning:
        `Campaign converting well but has limited impression volume and unused budget. ` +
        `Increasing bids by 25% to unlock more inventory and maximize sales potential.`,
    };
  }
}