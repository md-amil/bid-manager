import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ObjectType } from 'amazon-sp-api';
import mongoose, { Document } from 'mongoose';

export type CampaignDocument = Campaign & Document;

@Schema({ timestamps: false,_id:false })
export class Budget {
  @Prop({ required: true })
  budget: string[];

  @Prop({ required: true })
  budgetType: string;
}


@Schema({ timestamps: false, _id: false })
export class DynamicBidding {
  @Prop({
    type: [mongoose.Schema.Types.Mixed],
    default: [],
  })
  placementBidding: any[];

  @Prop({
    type: String,
    enum: ['LEGACY_FOR_SALES', 'AUTO_FOR_SALES'],
    default: 'LEGACY_FOR_SALES',
  })
  strategy: string;
}

enum State{
  PAUSED="PAUSED",
  ACTIVE="ACTIVE"
}

@Schema({ timestamps: true, _id:false })
export class Campaign {
  @Prop({ required: true, primaryKey:true })
  campaignId: string;

  @Prop({ required: true})
  scopeId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ type: Budget, required: false })
  budget: Budget;

  @Prop({ type: DynamicBidding, required: false })
  dynamicBidding:DynamicBidding

  @Prop({  required: false })
  marketplaceBudgetAllocation: string;

  @Prop({  required: false })
  startDate:Date

  @Prop({  required: false })
  state: 'PAUSED'|"ENABLED"

  // @Prop({  required: false })
  // tags: string

  @Prop({  required: false })
  targetingType: 'AUTO'

  spend:number
  sales:number
  orders:number
  clicks:number
  impressions:number
  roi:number
  keyword: number
  currentBid:number
}

export const CampaignSchema = SchemaFactory.createForClass(Campaign);


