import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { Campaign } from './campaign.schema';

export type AdGroupDocument = AdGroup & Document;

@Schema({ timestamps: true, _id: false })
export class AdGroup {
  @Prop({ required: true, unique: true, index: true })
  adGroupId: string;

  @Prop({
    ref: Campaign.name,
    index: true,
  })
  campaignId: string;

  @Prop({ required: true })
  profileId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  defaultBid: number;

  @Prop({})
  state: 'PAUSED' | 'ENABLED';
}

export const AdGroupSchema = SchemaFactory.createForClass(AdGroup);
