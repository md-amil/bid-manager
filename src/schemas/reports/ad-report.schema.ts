import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Campaign } from '../campaign.schema';
import { Ad } from '../ad.schema';

export type AdReportDocument = AdReport & Document;

@Schema({
  collection: 'ad_reports',
})
export class AdReport {
  @Prop({ required: true, index: true })
  date: string;

  @Prop({ ref: Campaign.name, required: true, index: true })
  campaignId: string;

  @Prop({ required: true, index: true })
  adGroupId: string;

  @Prop({ ref: Ad.name, required: true, index: true })
  adId: string;

  
  // @Prop()
  // addToList: number;

  // @Prop()
  // portfolioId: string;

  @Prop()
  impressions: number;

  @Prop()
  clicks: number;

  @Prop()
  costPerClick: number;

  @Prop()
  clickThroughRate: number;

  @Prop()
  cost: number;

  // @Prop()
  // campaignBudgetCurrencyCode: string;

  // @Prop()
  // campaignBudgetAmount: number;

  // @Prop()
  // campaignBudgetType: string;

  // @Prop()
  // campaignStatus: string;

  @Prop({ required: true, index: true })
  advertisedAsin: string;

  @Prop()
  advertisedSku: string;

  @Prop()
  purchases1d: number;

  @Prop()
  purchases7d: number;

  @Prop()
  purchases14d: number;

  @Prop()
  purchases30d: number;

  // @Prop()
  // purchasesSameSku1d: number;

  @Prop()
  purchasesSameSku7d: number;

  // @Prop()
  // purchasesSameSku14d: number;

  // @Prop()
  // purchasesSameSku30d: number;

  // @Prop()
  // unitsSoldClicks1d: number;

  @Prop()
  unitsSoldClicks7d: number;

  // @Prop()
  // unitsSoldClicks14d: number;

  // @Prop()
  // unitsSoldClicks30d: number;

  @Prop()
  sales1d: number;

  @Prop()
  sales7d: number;

  @Prop()
  sales14d: number;

  @Prop()
  sales30d: number;

  // @Prop()
  // attributedSalesSameSku1d: number;

  @Prop()
  attributedSalesSameSku7d: number;

  // @Prop()
  // attributedSalesSameSku14d: number;

  // @Prop()
  // attributedSalesSameSku30d: number;

  @Prop()
  salesOtherSku7d: number;

  // @Prop()
  // unitsSoldSameSku1d: number;

  @Prop()
  unitsSoldSameSku7d: number;

  // @Prop()
  // unitsSoldSameSku14d: number;

}

export const AdReportSchema =
  SchemaFactory.createForClass(AdReport);
