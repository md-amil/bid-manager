import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CampaignReportDocument = CampaignReport & Document;

@Schema({
  collection: 'campaign_reports',
})
export class CampaignReport {
  @Prop({ required: true, index: true })
  date: string; 

  @Prop({ required: true, index: true })
  campaignId: number;

  @Prop({ required: true })
  campaignName: string;

  // @Prop({ required: true, index: true })
  // retailer: string;

  @Prop({ required: true })
  campaignStatus: string;

  @Prop()
  campaignBudgetAmount: number;

  @Prop()
  campaignBudgetCurrencyCode: string;

  @Prop()
  campaignBudgetType: string;

  @Prop({ type: Number, default: null })
  campaignRuleBasedBudgetAmount: number | null;

  @Prop({ type: String, default: null })
  campaignApplicableBudgetRuleId: string | null;

  @Prop({ type: String, default: null })
  campaignApplicableBudgetRuleName: string | null;

  @Prop()
  campaignBiddingStrategy: string;

  @Prop()
  topOfSearchImpressionShare: number;

  @Prop() impressions: number;
  @Prop() clicks: number;
  @Prop() cost: number;
  @Prop() spend: number;
  @Prop() costPerClick: number;
  @Prop() clickThroughRate: number;

  @Prop() sales1d: number;
  @Prop() sales7d: number;
  @Prop() sales14d: number;
  @Prop() sales30d: number;

  @Prop() purchases1d: number;
  @Prop() purchases7d: number;
  @Prop() purchases14d: number;
  @Prop() purchases30d: number;

  @Prop() purchasesSameSku1d: number;
  @Prop() purchasesSameSku7d: number;
  @Prop() purchasesSameSku14d: number;
  @Prop() purchasesSameSku30d: number;

  @Prop() unitsSoldSameSku1d: number;
  @Prop() unitsSoldSameSku7d: number;
  @Prop() unitsSoldSameSku14d: number;
  @Prop() unitsSoldSameSku30d: number;

  @Prop() unitsSoldClicks1d: number;
  @Prop() unitsSoldClicks7d: number;
  @Prop() unitsSoldClicks14d: number;
  @Prop() unitsSoldClicks30d: number;

  @Prop() attributedSalesSameSku1d: number;
  @Prop() attributedSalesSameSku7d: number;
  @Prop() attributedSalesSameSku14d: number;
  @Prop() attributedSalesSameSku30d: number;

  @Prop({ type: Number, default: null })
  acosClicks14d: number;

  @Prop() roasClicks14d: number;

  /* -------- Kindle / Borrows -------- */
  // @Prop() qualifiedBorrows: number;
  // @Prop() royaltyQualifiedBorrows: number;
  // @Prop() kindleEditionNormalizedPagesRead14d: number;
  // @Prop() kindleEditionNormalizedPagesRoyalties14d: number;

  /* -------- Engagement -------- */
  // @Prop() addToList: number;
}

export const CampaignReportSchema =
  SchemaFactory.createForClass(CampaignReport);