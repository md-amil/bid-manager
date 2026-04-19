import { ICampaignRuleDecision } from "src/engine/interfaces";
import BaseDailyRule from "./base-daily.rule";
import { AdjustmentLog, EAction, ETarget, Adjustment } from "src/schemas/log.schema";
import { DailyCampaignBundle } from "src/interfaces/index.type";

/**
 * RULE: ASIN Out of Stock (Daily - 24 Hour)
 * Condition: Product marked as out of stock or inventory = 0
 * Action: PAUSE all campaigns for this ASIN immediately
 * NOTE: Prevents wasted spend on unavailable product
 */
export class DailyASINOutOfStockRule extends BaseDailyRule implements ICampaignRuleDecision {

  constructor(bundle: DailyCampaignBundle) {
    super(bundle);
  }

  shouldApply(): boolean {
    // Check if any of the advertised products are out of stock
    const outOfStockProducts = this.getOutOfStockProducts();
    return outOfStockProducts.length > 0;
  }

  execute(): AdjustmentLog {
    // Get ads with out of stock products
    const outOfStockAds = this.ads.filter(ad => 
      ad.product && ad.product.availability !== 'IN_STOCK'
    );

    const productNames = outOfStockAds
      .map(ad => ad.product?.title || ad.product?.sku || ad.asin)
      .join(', ');

    const adjustments: Adjustment[] = [
      { action: EAction.PAUSE_AD, target: ETarget.ADS }
    ];

    return {
      ruleId: 'DAILY_003',
      ruleName: 'ASIN Out of Stock - Emergency Pause',
      campaignId: this.campaign.campaignId,
      campaignName: this.campaign.name,
      adjustments,
      // Include ads with product info in the log
      ads: outOfStockAds.map(ad => ({
        adId: ad.adId,
        asin: ad.asin,
        sku: ad.sku,
        state: ad.state,
        product: {
          title: ad.product?.title,
          brand: ad.product?.brand,
          availability: ad.product?.availability,
          imageUrl: ad.product?.imageUrl,
          price: ad.product?.priceToPay?.amount,
          currency: ad.product?.priceToPay?.currency
        }
      })),
      reasoning:
        `${outOfStockAds.length} ad(s) with out of stock products: ${productNames}. ` +
        `Pausing campaign immediately to prevent wasted spend. ` +
        `Resume when inventory is available.`,
    };
  }
}
