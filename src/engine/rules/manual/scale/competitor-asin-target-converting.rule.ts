import { AutoCampaignAdjustment, ICampaignBundle, ICampaignRuleDecision } from "src/engine/interfaces";
import { Type } from "src/schemas/campaign.schema";
import BaseRule, { config } from "../../base.rule";

/**
 * RULE 005: Product Targeting (Competitor ASIN) Is Converting
 * Indicators: ASIN targeting generating sales, ACOS within target, competitive pricing
 * Action: Increase bids 15%, Increase Product Page placement 20%
 */
export class CompetitorASINTargetingConvertingRule extends BaseRule implements ICampaignRuleDecision {
  shouldApply(): boolean {
    if (this.campaign.targetingType==Type.AUTO) return false;
    if(!this.metrics) return false
    // if (!campaign.metrics7d) return false;

    // const metrics = this.metrics;
    // const acos = this.metrics.spend > 0 ? this.metrics.spend / this.metrics.sales7d : Infinity;

    // Check if ASIN targeting is contributing to sales
    const hasASINTargeting = this.searchTerms?.some(st => st.searchTerm.includes('ASIN')) || false;

    return (
      hasASINTargeting &&
        this.metrics.sales7d >= config.minSales &&
      this.acos <= config.targetAcos
    );
  }

  execute(): AutoCampaignAdjustment {
    // const metrics = campaign.matrics!;
    const asos = (this.metrics.spend / this.metrics.sales7d * 100).toFixed(2);

    return {
      ruleId: 'MANUAL_SCALE_005',
      ruleName: 'Scale Competitor ASIN Targeting',
      campaignId: this.campaign.campaignId,
      adjustments: {
        bidChanges: [
          // { targetingType: 'PRODUCT_PAGE', change: 15 },
          // { targetingType: 'PRODUCT_PAGE_PLACEMENT', change: 20 },
        ],
        action: 'INCREASE',
      },
      reasoning:
        `Competitor ASIN targeting is converting with ACOS ${asos}% (within target). ` +
        `Increasing bids 15% and Product Page placement 20% to scale winning strategy.`,
    };
  }
}