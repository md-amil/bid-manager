import { config } from "../core/rule.engine";
import { AutoCampaignAdjustment, AutoTargetingType, ICampaignBundle, ICampaignRuleDecision } from "../interfaces";

// RULE 5: Listing Conversion Issues
export class ListingConversionIssuesRule implements ICampaignRuleDecision {
  shouldApply({matrics}: ICampaignBundle): boolean {
     const impressionsOk =
                matrics.impressions >= config.minImpressions;
            const clicksOk =
                matrics.clicks >= config.minClicks;
            const lowSales =
                matrics.purchases7d === 0 ||
                matrics.purchases7d / matrics.clicks < config.minCvr;
            // const listingQualityPoor =
            //     metrics.rating < thresholds.minRating ||
            //     metrics.priceIndex > thresholds.maxPriceIndex ||
            //     metrics.contentScore < thresholds.minContentScore;
            return impressionsOk && clicksOk && lowSales;
    // const metrics = campaign.matrics;
    // const hasGoodTraffic = metrics.getSpend() > 100 && metrics.getCTR() > 1;
    // const poorConversion = metrics.getSales() === 0 || metrics.getSales() < metrics.getSpend() * 0.3;
    // return hasGoodTraffic && poorConversion;
  }

  execute(campaign: ICampaignBundle): AutoCampaignAdjustment {
    return {
      ruleId: 'RULE_005',
      ruleName: 'Listing Conversion Issues Detected',
      campaignId: campaign.id,
      adjustments: {
        bidChanges: [
          { targetingType: AutoTargetingType.CLOSE_MATCH, change: -50 },
          { targetingType: AutoTargetingType.LOOSE_MATCH, change: -50 },
          { targetingType: AutoTargetingType.SUBSTITUTES, change: -50 },
          { targetingType: AutoTargetingType.COMPLEMENTS, change: -50 },
        ],
        action: 'DECREASE',
      },
      reasoning:
        `Good impressions and clicks detected but low sales indicate listing conversion issues ` +
        `(poor reviews, pricing, or content). Reducing all bids by 50% until listing improvements are made.`,
    };
  }
}
