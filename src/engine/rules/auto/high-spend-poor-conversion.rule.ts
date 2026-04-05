import { AdjustmentLog, EAction, ETarget } from "src/schemas/log.schema";
import { ICampaignBundle, ICampaignRuleDecision } from "../../interfaces";
import AutoCampaignBaseRule, { config } from "../base.rule";

// RULE 4: High Spend with Poor Conversion
export class HighSpendPoorConversionRule extends AutoCampaignBaseRule implements ICampaignRuleDecision {

  // review search terms immediately.

  constructor(bundle: ICampaignBundle) {
    super(bundle)
  }

  shouldApply(): boolean {
    const highClicks = this.metrics.clicks > config.minClicks;
    const highSpend = this.metrics.cost > config.minSpend;
    const lowOrZeroSales = this.metrics.sales === 0 || this.acos > config.targetAcos;
    const risingACOS = this.acos > config.targetAcos;
    return highClicks && highSpend && lowOrZeroSales;
  }
  getCampaign(){
    return {
      campaignId: this.campaign.campaignId,
      name: this.campaign.name,
      budget: this.campaign.budget,
    }
  }

  getTarget(){
    const targetings = this.getTargeting()
    return targetings.map(t=>({
      targetingId: t.targetId,
      targetingType: t.expressionType,
      expression: t.expression,
      bid:t.bid
    }))
   
  }

  execute(): AdjustmentLog {
    return {
      ruleId: 'RULE_004',
      ruleName: 'High Spend with Poor Conversion',
      campaignId: this.campaign.campaignId,
      campaignName: this.campaign.name,
      adjustments: [
        {
          action: EAction.DECREASE_BUDGET,
          change: -25,
          target: ETarget.CAMPAIGN
        },
        // {
        //   action: EAction.DECREASE_BID,
        //   change: -25,
        //   target: ETarget.TARGETING
        // }
      ],
      // targetings: this.getTarget(),
      campaign: this.getCampaign(),
      reasoning:
        `High clicks with low or zero sales and rising ACOS detected. ` +
        `Lowering bids and budget by 25% and recommending immediate search term review.`,
    };
  }
}
