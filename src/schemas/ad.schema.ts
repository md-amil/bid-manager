import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { Campaign } from './campaign.schema';
import { AdGroup } from './ad-group.schema';

export type AdDocument = Ad & Document;

@Schema({ timestamps: true })
export class Ad {
  @Prop({ required: true, unique: true, index: true })
  adId: string;

  @Prop({ required: true, index: true })
  profileId: string;


  @Prop({
    ref: Campaign.name,
    index: true,
  })
  campaignId: string;

  @Prop({
    ref: AdGroup.name,
    index: true,
  })
  adGroupId: string;

  @Prop({ required: true })
  asin: string;

  @Prop({ required: true })
  sku: string;

  @Prop({ default: 'ENABLED' })
  state: 'ENABLED';
}

export const AdSchema = SchemaFactory.createForClass(Ad);

