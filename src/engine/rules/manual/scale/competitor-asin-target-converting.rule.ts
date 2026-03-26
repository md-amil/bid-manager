import { AutoCampaignAdjustment, ICampaignRuleDecision } from "src/engine/interfaces";
import { Type } from "src/schemas/campaign.schema";
import BaseRule, { config } from "../../base.rule";
import { AdjustmentLog, EAction } from "src/schemas/log.schema";

/**
 * RULE 005: Product Targeting (Competitor ASIN) Is Converting
 * Indicators: ASIN targeting generating sales, ACOS within target, competitive pricing
 * Action: Increase bids 15%, Increase Product Page placement 20%
 */
export class CompetitorASINTargetingConvertingRule extends BaseRule implements ICampaignRuleDecision {
  shouldApply(): boolean {
    if (this.campaign.targetingType==Type.AUTO) return false;
    if(!this.metrics) return false

    // Check if ASIN targeting is contributing to sales
    const hasASINTargeting = this.searchTerms?.some(st => st.searchTerm.includes('ASIN')) || false;

    return (
      hasASINTargeting &&
        this.sales >= config.minSales &&
      this.acos <= config.targetAcos
    );
  }

  execute(): AdjustmentLog {
    const asos = this.acos*100;

    return {
      ruleId: 'MANUAL_SCALE_005',
      ruleName: 'Scale Competitor ASIN Targeting',
      campaignId: this.campaign.campaignId,
      adjustments:[
        {
          action: EAction.INCREASE_BID,
          change: 15,
          // target: target is not clear here need to discuss
        }
      ],
      reasoning:
        `Competitor ASIN targeting is converting with ACOS ${asos}% (within target). ` +
        `Increasing bids 15% and Product Page placement 20% to scale winning strategy.`,
    };
  }
}