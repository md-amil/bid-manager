import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type BidAdjustmentLogDocument = BidAdjustmentLog & Document;

@Schema({ timestamps: true })
export class BidAdjustmentLog {
  @Prop({ required: true })
  campaignId: string;

  @Prop({ required: true })
  keyword: string;

  @Prop({ required: true })
  oldBid: number;

  @Prop({ required: true })
  newBid: number;

  @Prop({ required: true })
  roi: number;

  @Prop({ required: true })
  reason: string;

  @Prop({ required: true })
  adjustmentPercentage: number;

  @Prop({ default: 'success' })
  status: string;

  @Prop()
  errorMessage: string;
}

export const BidAdjustmentLogSchema = SchemaFactory.createForClass(BidAdjustmentLog);
