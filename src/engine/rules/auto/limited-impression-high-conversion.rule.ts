// import { AutoCampaign, AutoCampaignAdjustment, AutoTargetingType, IAutoCampaignRuleDecision } from "files (2)/auto-campaign-rules";
import { AutoCampaignAdjustment, TargetingType, ICampaignBundle, ICampaignRuleDecision } from "../../interfaces";
import AutoCampaignBaseRule, { config } from "../base.rule";

// RULE 3: Good Conversion Rate with Limited Impressions
export class LimitedImpressionsHighConversionRule extends AutoCampaignBaseRule implements ICampaignRuleDecision {
  
   constructor (bundle:ICampaignBundle){
    super(bundle)
  }

  shouldApply(): boolean {
        const { impressions, clicks, sales7d } = this.metrics
        if (clicks == 0) return false
        const convRate = sales7d / clicks
        return convRate > 0.05 && impressions < 500 && this.utilization < config.budgetUtilizationThreshold;
  }

  execute(): AutoCampaignAdjustment {
    return {
      ruleId: 'RULE_003',
      ruleName: 'Increase Bids for Limited Impressions',
      campaignId: this.campaign.campaignId,
      adjustments: {
        bidChanges: [
          { targetingType: TargetingType.CLOSE_MATCH, change: 25 },
          { targetingType: TargetingType.LOOSE_MATCH, change: 25 },
        ],
        action: 'INCREASE',
      },
      reasoning:
        `Campaign converting well but has limited impression volume and unused budget. ` +
        `Increasing bids by 25% to unlock more inventory and maximize sales potential.`,
    };
  }
}