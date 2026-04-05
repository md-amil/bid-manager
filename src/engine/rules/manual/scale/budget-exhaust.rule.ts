import { AutoCampaignAdjustment, ICampaignBundle, ICampaignRuleDecision } from "src/engine/interfaces";
import { Type } from "src/schemas/campaign.schema";
import AutoCampaignBaseRule, { config } from "../../base.rule";
import { AdjustmentLog, EAction } from "src/schemas/log.schema";

/**
 * RULE 002: High Sales but Limited by Budget
 * Indicators: Campaign runs out of budget early, ACOS under control, sales consistent
 * Action: Increase daily budget 25%, Do NOT change bids
 */
export class BudgetExhaustionManualCampaignRule extends AutoCampaignBaseRule implements ICampaignRuleDecision {
  constructor(bundle: ICampaignBundle) {
    super(bundle);
  }
  shouldApply(): boolean {
    if (this.campaign.targetingType == Type.AUTO) return false;
    // const { matrics, budget } = campaign
    // const { impressions, clicks, sales7d, spend } = matrics
    const budgetUtilized = this.getUtilization() >= config.budgetUtilizationThreshold;
    // const acos = spend > 0
    //   ? spend / sales7d
    //   : Infinity;
    const acos = this.calculateACOS();
    return budgetUtilized && acos <= config.targetAcos 
  }

 
  execute(): AdjustmentLog {
    const dailyUtilization = this.getUtilization();
    return {
      ruleId: 'MANUAL_SCALE_002',
      ruleName: 'Increase Budget - Exhaustion Early',
      campaignId: this.campaign.campaignId,
      campaignName: this.campaign.name,
      adjustments:[
        {
          action:EAction.INCREASE_BUDGET,
          change: 25,
        }
      ],
      reasoning:
        `Campaign running out of budget early (${(dailyUtilization * 100).toFixed(2)}% utilized). ` +
        `ACOS under control. Increasing budget 25% only - bids remain unchanged to preserve profitability.`,
    };
  }
}