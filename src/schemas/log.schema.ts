import { Prop, Schema,SchemaFactory } from '@nestjs/mongoose';
import { Mongoose ,Schema as MongooseSchema } from 'mongoose';
import { Campaign } from './campaign.schema';


export enum EAction {
  NA='NA',
  SUGGESTED='SUGGESTED',

  INCREASE_BID = 'INCREASE_BID',
  DECREASE_BID = 'DECREASE_BID',
 
  INCREASE_BUDGET = 'INCREASE_BUDGET',
  DECREASE_BUDGET = 'DECREASE_BUDGET',

  PAUSE_CAMPAIGN = 'PAUSE_CAMPAIGN',
  RESUME_CAMPAIGN = 'RESUME_CAMPAIGN',

  ADD_EXACT = 'ADD_EXACT',
  ADD_PHRASE='ADD_PHRASE',
  ADD_BROAD='ADD_BROAD',

  ADD_NEGATIVE = 'ADD_NEGATIVE',
  ADD_NEGATIVE_EXACT='ADD_NEGATIVE_EXACT',
  ADD_NEGATIVE_PHARASE='ADD_NEGATIVE_PHARASE',
  MOVE_TO_MANUAL='MOVE_TO_MANAUAL' //for future
  // REMOVE_NEGATIVE = 'REMOVE_NEGATIVE',
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
  CAMPAIGN = 'campaign',
  TARGETING = 'targetings',
  KEYWORDS = 'keywords',
  TERMS = 'searchTerms',
  OTHER='other'
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


@Schema({ _id: false })
export class LogTargeting {
  @Prop({ required: true })
  targetId: string;

  // @Prop({ required: true })
  // expressionType: string;

  @Prop({ required: true })
  targetingType: string;

  @Prop({ required: true })
  expression: string;

  @Prop({ required: true })
  bid: number;
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

  @Prop({ required: true })
  campaignName: string;
  

  @Prop({ index: true })
  scopeId?: string;

  @Prop({ type: [Adjustment], default: [] })
  adjustments: Adjustment[];

  @Prop({ type: MongooseSchema.Types.Mixed })
  targetings?: LogTargeting[];

  @Prop({ type: MongooseSchema.Types.Mixed })
  campaign?:any

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