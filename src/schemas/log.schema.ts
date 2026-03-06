import { Prop, Schema,SchemaFactory } from '@nestjs/mongoose';
import { Mongoose ,Schema as MongooseSchema } from 'mongoose';
import { Campaign } from './campaign.schema';


export enum EAction {
  SUGGESTED='SUGGESTED',
  INCREASE_BID = 'INCREASE_BID',
  DECREASE_BID = 'DECREASE_BID',
  MOVE = 'MOVE',
  ADD_NEGATIVE = 'ADD_NEGATIVE',
  REMOVE_NEGATIVE = 'REMOVE_NEGATIVE',
  INCREASE_BUDGET = 'INCREASE_BUDGET',
  DECREASE_BUDGET = 'DECREASE_BUDGET',
  PAUSE_CAMPAIGN = 'PAUSE_CAMPAIGN',
  RESUME_CAMPAIGN = 'RESUME_CAMPAIGN',
}



// @Schema({ _id: false })
// export class TargetAdjustment {

//   @Prop({
//     required: true,
//     enum: ['KEYWORD', 'SEARCH_TERM', 'TARGETING'],
//   })
//   type: 'KEYWORD' | 'SEARCH_TERM' | 'TARGETING';

//   @Prop()
//   entityId?: string; 

//   @Prop()
//   value?: string; 

//   @Prop({
//     required: true,
//     enum: EAction,
//   })
//   action: EAction;
//   @Prop()
//   previousBid?: number;

//   @Prop()
//   newBid?: number;

//   @Prop()
//   change?: number;

//   @Prop()
//   targetCampaignId?: string;

//   @Prop()
//   targetAdGroupId?: string;
// }


// @Schema({ _id: false })
// export class CampaignAdjustment {
//   @Prop()
//   change?: number;

//   @Prop({enum: EAction})
//   action: EAction;
// }

// export type AdjustmentLogDocument = AdjustmentLog & Document;

// @Schema({ timestamps: true })
// export class AdjustmentLog {

//   @Prop({ required: true })
//   ruleId: string;

//   @Prop({ required: true })
//   ruleName: string;

//   @Prop({ required: true })
//   campaignId: string;

//   @Prop()
//   reasoning?: string;

//   @Prop({ type: CampaignAdjustment })
//   campaignAdjustment?: CampaignAdjustment;

//   @Prop({ type: [TargetAdjustment], default: [] })
//   targetingAdjustments?: TargetAdjustment[];

// }

// export const AdjustmentLogSchema =
//   SchemaFactory.createForClass(AdjustmentLog);



export enum ETarget {
  TARGETING = 'targetings',
  KEYWORDS = 'keywords',
  TERMS = 'searchTerms',
}

@Schema({ _id: false })
export class Adjustment {
  @Prop({ enum: EAction, required: true })
  action: EAction;

  @Prop({ enum: ETarget, })
  target?: ETarget;

  @Prop({ type: Number, })
  change?: number;
}

@Schema({ timestamps: true })
export class AdjustmentLog  {

  @Prop({ required: true })
  ruleId: string;

  @Prop({ required: true })
  ruleName: string;

  @Prop({
    ref: Campaign.name,
    index: true,
  })
  campaignId: string;

  @Prop({ type: [Adjustment], default: [] })
  adjustments: Adjustment[];

  @Prop({ type: MongooseSchema.Types.Mixed })
  targetings?: any[];

  @Prop({ type: MongooseSchema.Types.Mixed })
  keywords?: any[];

  @Prop({ type: MongooseSchema.Types.Mixed })
  searchTerms?: any[];

  @Prop()
  reasoning: string;
}

export type LogDocument = Document&Adjustment

export const AdjustmentLogSchema =
  SchemaFactory.createForClass(AdjustmentLog);