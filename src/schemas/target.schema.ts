import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from 'mongoose';

export type TargetDocument = Target & Document;

@Schema({ timestamps: true })
export class Target {

  @Prop({ required: true, unique: true, index: true })
  targetId: string;

  @Prop({ required: true,  index: true })
  scopeId: string;

  @Prop({ required: true, index: true })
  campaignId: string;

  @Prop({ required: true, index: true })
  adGroupId: string;

  @Prop()
  bid?: number;

  @Prop({
    type: [
      {
         _id: false,   
        type: { type: String },
        value: { type: String },
      },
    ],
  })
  expression: {
    type: string;
    value?: string;
  }[];

  @Prop({
    type: [
      {
         _id: false,   
        type: { type: String },
        value: { type: String },
      },
    ],
  })
  resolvedExpression: {
    type: string;
    value?: string;
  }[];

  @Prop({
    enum: ['AUTO', 'MANUAL'],
    index: true,
  })
  expressionType?: string;

  @Prop({
    enum: ['ENABLED', 'PAUSED', 'ARCHIVED'],
    default: 'ENABLED',
  })
  state: string;
@Prop({
    enum: [1, -1],
    default: 1,
  })
  type:1|-1
}

export const TargetSchema = SchemaFactory.createForClass(Target);
