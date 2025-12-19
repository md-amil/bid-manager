import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CampaignDocument = Campaign & Document;

@Schema({ timestamps: true })
export class Campaign {
  @Prop({ required: true, unique: true })
  campaignId: string;

  @Prop({ required: true })
  campaignName: string;

  @Prop({ required: true })
  adGroupId: string;

  @Prop({ required: true })
  keyword: string;

  @Prop({ required: true })
  currentBid: number;

  @Prop({ default: 0 })
  sales: number;

  @Prop({ default: 0 })
  spend: number;

  @Prop({ default: 0 })
  clicks: number;

  @Prop({ default: 0 })
  impressions: number;

  @Prop({ default: null })
  roi: number;

  @Prop({ default: null })
  lastAdjustedAt: Date;

  @Prop({ default: 'active' })
  status: string;
}

export const CampaignSchema = SchemaFactory.createForClass(Campaign);
