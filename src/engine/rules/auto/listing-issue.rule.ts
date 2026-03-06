import { AdjustmentLog, EAction, ETarget } from "src/schemas/log.schema";
import { AutoCampaignAdjustment, TargetingType, ICampaignBundle, ICampaignRuleDecision } from "../../interfaces";
import AutoCampaignBaseRule, { config } from "../base.rule";

// RULE 5: Listing Conversion Issues
export class ListingConversionIssuesRule extends AutoCampaignBaseRule implements ICampaignRuleDecision {
  constructor(bundle: ICampaignBundle) {
    super(bundle)
  }

  shouldApply(): boolean {
    const impressionsOk = this.impressions >= config.minImpressions;
    const clicksOk = this.clicks >= config.minClicks;
    const lowSales = this.metrics.purchases7d === 0 || (this.cvr) < config.minCvr;
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

  execute(): AdjustmentLog {
    const targetings = [
          { targetingType: TargetingType.CLOSE_MATCH, change: -50 },
          { targetingType: TargetingType.LOOSE_MATCH, change: -50 },
          { targetingType: TargetingType.SUBSTITUTES, change: -50 },
          { targetingType: TargetingType.COMPLEMENTS, change: -50 },
        ]
    return {
      ruleId: 'RULE_005',
      ruleName: 'Listing Conversion Issues Detected',
      campaignId: this.campaign.campaignId,
      adjustments:[
        {
          action:EAction.DECREASE_BID,
          target:ETarget.TARGETING,
          change:-50
        }
      ],
      targetings,
      reasoning:
        `Good impressions and clicks detected but low sales indicate listing conversion issues ` +
        `(poor reviews, pricing, or content). Reducing all bids by 50% until listing improvements are made.`,
    };
  }
}
