import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Campaign } from '../campaign.schema';
import { AdGroup } from '../ad-group.schema';

export type AdGroupReportDocument = AdGroupReport & Document;

@Schema({
  collection: 'adgroup_reports',
})
export class AdGroupReport {
  @Prop({ required: true, index: true })
  date: string;

  @Prop({ ref: Campaign.name, required: true, index: true })
  campaignId: string;

  @Prop({ ref: AdGroup.name, required: true, index: true })
  adGroupId: string;

//   @Prop()
//   campaignName: string;

//   @Prop()
//   adGroupName: string;

  // Core Performance Metrics
  @Prop()
  impressions: number;

  @Prop()
  clicks: number;

  @Prop()
  cost: number;


  @Prop()
  costPerClick: number;

  @Prop()
  clickThroughRate: number;
  
  @Prop()
  sales1d: number;

  @Prop()
  sales7d: number;

  @Prop()
  sales14d: number;

  @Prop()
  attributedSalesSameSku7d: number;

  @Prop()
  attributedSalesSameSku14d: number;

  // Purchase Metrics
  @Prop()
  purchases1d: number;

  @Prop()
  purchases7d: number;

  @Prop()
  purchases14d: number;

  @Prop()
  purchasesSameSku7d: number;

  @Prop()
  purchasesSameSku14d: number;

  // Units Sold
  @Prop()
  unitsSoldClicks7d: number;

  @Prop()
  unitsSoldClicks14d: number;

  @Prop()
  unitsSoldSameSku7d: number;

  @Prop()
  unitsSoldSameSku14d: number;

  // ACOS & ROAS (Key optimization metrics)
  @Prop()
  acosClicks7d: number;

  @Prop()
  acosClicks14d: number;

  @Prop()
  roasClicks7d: number;

  @Prop()
  roasClicks14d: number;

  // Campaign Context
  @Prop()
  campaignStatus: string;

  @Prop()
  campaignBudgetAmount: number;

  @Prop()
  campaignBudgetCurrencyCode: string;

  @Prop()
  campaignBudgetType: string;
}

export const AdGroupReportSchema =
  SchemaFactory.createForClass(AdGroupReport);
