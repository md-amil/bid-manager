import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { TargetingType } from "src/engine/interfaces";
export type TargetReportDocument = TargetReport & Document;

@Schema({
    collection: 'target_reports',
})
export class TargetReport {
    @Prop({ index: true }) date: string;
    @Prop({ index: true }) targetId: string;
    
    @Prop() keyword: string;
    @Prop() matchType: string
    @Prop() targeting: TargetingType

    @Prop() impressions: number;
    @Prop() clicks: number;
    @Prop() cost: number;

    @Prop() sales7d: number;
    @Prop() sales14d: number;

    @Prop() purchases7d: number;
    @Prop() purchases14d: number;

    @Prop() unitsSoldClicks7d: number;
    @Prop() unitsSoldClicks14d: number;
    @Prop() topOfSearchImpressionShare: number;
}

export const TargetReportSchema =
    SchemaFactory.createForClass(TargetReport);

//   "matchType": "TARGETING_EXPRESSION",
//       {
//         "date": "2026-03-09",
//         "attributedSalesSameSku1d": 0,
//         "roasClicks14d": null,
//         "unitsSoldClicks1d": 0,
//         "attributedSalesSameSku14d": 0,
//         "sales7d": 0,
//         "attributedSalesSameSku30d": 0,
//         "kindleEditionNormalizedPagesRoyalties14d": 0,
//         "unitsSoldSameSku1d": 0,
//         "campaignStatus": "ENABLED",
//         "keyword": "keyword-group=\"category\"",
//         "salesOtherSku7d": 0,
//         "purchasesSameSku7d": 0,
//         "campaignBudgetAmount": 400.0,
//         "purchases7d": 0,
//         "unitsSoldSameSku30d": 0,
//         "costPerClick": 0.0,
//         "unitsSoldClicks14d": 0,
//         "adGroupName": "chking auto",
//         "campaignId": 550669026247354,
//         "clickThroughRate": 0,
//         "kindleEditionNormalizedPagesRead14d": 0,
//         "acosClicks14d": null,
//         "unitsSoldClicks30d": 0,
//         "qualifiedBorrows": 0,
//         "portfolioId": null,
//         "campaignBudgetCurrencyCode": "INR",
//         "roasClicks7d": null,
//         "unitsSoldSameSku14d": 0,
//         "unitsSoldClicks7d": 0,
//         "keywordId": 278064843207963,
//         "attributedSalesSameSku7d": 0,
//         "topOfSearchImpressionShare": null,
//         "royaltyQualifiedBorrows": 0,
//         "adGroupId": 323531413557908,
//         "addToList": 0,
//         "keywordBid": 16.92,
//         "targeting": "keyword-group=\"Keywords related to your product category\"",
//         "purchasesSameSku14d": 0,
//         "unitsSoldOtherSku7d": 0,
//         "purchasesSameSku1d": 0,
//         "campaignBudgetType": "DAILY_BUDGET",
//         "keywordType": "TARGETING_EXPRESSION",
//         "purchases1d": 0,
//         "unitsSoldSameSku7d": 0,
//         "cost": 0,
//         "sales14d": 0,
//         "acosClicks7d": null,
//         "impressions": 71,
//         "purchasesSameSku30d": 0,
//         "purchases14d": 0,
//         "purchases30d": 0,
//         "clicks": 0,
//         "campaignName": "m-chiking"
//     },
//     {
//         "date": "2026-03-09",
//         "attributedSalesSameSku1d": 3994.26,
//         "roasClicks14d": 3.0366419476338806,
//         "unitsSoldClicks1d": 7,
//         "matchType": "TARGETING_EXPRESSION_PREDEFINED",
//         "attributedSalesSameSku14d": 3994.26,
//         "sales7d": 4659.97,
//         "attributedSalesSameSku30d": 3994.26,
//         "kindleEditionNormalizedPagesRoyalties14d": 0,
//         "unitsSoldSameSku1d": 6,
//         "campaignStatus": "ENABLED",
//         "keyword": "close-match",
//         "salesOtherSku7d": 665.71,
//         "purchasesSameSku7d": 5,
//         "campaignBudgetAmount": 15000.0,
//         "purchases7d": 6,
//         "unitsSoldSameSku30d": 6,
//         "costPerClick": 8.72,
//         "unitsSoldClicks14d": 7,
//         "adGroupName": "solar-auto",
//         "campaignId": 2834576461140,
//         "clickThroughRate": 1.2474307179814303,
//         "kindleEditionNormalizedPagesRead14d": 0,
//         "acosClicks14d": 32.931113290428904,
//         "unitsSoldClicks30d": 7,
//         "qualifiedBorrows": 0,
//         "portfolioId": null,
//         "campaignBudgetCurrencyCode": "INR",
//         "roasClicks7d": 3.0366419476338806,
//         "unitsSoldSameSku14d": 6,
//         "unitsSoldClicks7d": 7,
//         "keywordId": 61197552078613,
//         "attributedSalesSameSku7d": 3994.26,
//         "topOfSearchImpressionShare": 0.48,
//         "royaltyQualifiedBorrows": 0,
//         "adGroupId": 388876823359664,
//         "addToList": 0,
//         "keywordBid": 4,
//         "targeting": "close-match",
//         "purchasesSameSku14d": 5,
//         "unitsSoldOtherSku7d": 1,
//         "purchasesSameSku1d": 5,
//         "campaignBudgetType": "DAILY_BUDGET",
//         "keywordType": "TARGETING_EXPRESSION_PREDEFINED",
//         "purchases1d": 6,
//         "unitsSoldSameSku7d": 6,
//         "cost": 1534.58,
//         "sales14d": 4659.97,
//         "acosClicks7d": 32.931113290428904,
//         "impressions": 14109,
//         "purchasesSameSku30d": 5,
//         "purchases14d": 6,
//         "purchases30d": 6,
//         "clicks": 176,
//         "campaignName": "solat-auto"
//     },