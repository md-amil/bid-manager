import { AutoCampaignAdjustment, ICampaignBundle, ICampaignRuleDecision } from "src/engine/interfaces";
import AutoCampaignBaseRule, { config } from "../../base.rule";
import { Type } from "src/schemas/campaign.schema";
import { AdjustmentLog, EAction } from "src/schemas/log.schema";

/**
 * RULE 004: Budget Wastage Without Returns
 * Indicators: Spend increasing, sales minimal, ACOS very high
 * Action: Reduce budget 25%, Shift budget to better-performing campaign
 */
export class BudgetWastageManualRule  extends AutoCampaignBaseRule implements ICampaignRuleDecision {
  // private acosThreshold: number;
  // private minSpend: number;



  // constructor(acosThreshold: number = 0.50, minSpend: number = 300) {
  //   this.acosThreshold = acosThreshold;
  //   this.minSpend = minSpend;
  // }


  constructor( bundle: ICampaignBundle ) {
    super(bundle)
  }

  shouldApply(): boolean {
    if (this.campaign.targetingType !== Type.MANUAL) return false;
    if(!this.metrics) return false;
    if(this.isLaunchPhase) return false

    const acos = this.acos
    const highSpend = this.cost >= this.minSpendThreshold()
    const highAcos = acos >= config.targetAcos * 2; // Significantly above target
    return (
      highSpend && highAcos && this.sales < config.minSales
    );
  }

  execute(): AdjustmentLog {
    // const metrics = campaign.metrics7d!;
    // const acos = (metrics.spend / metrics.sales * 100).toFixed(2);
    return {
      ruleId: 'MANUAL_CONTROL_004',
      ruleName: 'Reduce Budget - Wastage Without Returns',
      campaignId: this.campaign.campaignId,
      adjustments:[
        {
          action:EAction.DECREASE_BUDGET,
          change:-25
        }
      ],
      reasoning:
        `Campaign spending ${this.cost.toFixed(2)} with ACOS ${this.acos}% and only ${this.sales} sales. ` +
        `Budget is being wasted. Reducing budget 25% and recommending shift to better-performing campaign.`,
    };
  }
}