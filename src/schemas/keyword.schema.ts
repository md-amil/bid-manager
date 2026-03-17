
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type KeywordDocument = Keyword & Document;

export enum MatchType {
  EXACT = "EXACT",
  PHRASE = "PHRASE",
  BROAD = "BROAD"
}


enum Type {
  NEGATIVE = "-1",
  POSITIVE = "1",
}

@Schema({ timestamps: true })
export class Keyword extends Document {
  @Prop({ required: true })
  adGroupId: string;

  @Prop({ required: true, index: true })
  profileId: string;


  @Prop({ required: true })
  campaignId: string;

  @Prop({ required: true })
  keywordId: string;

  @Prop({ required: true })
  keywordText: string;

  @Prop({})
  bid: string;

  @Prop({
    type: String,
    enum: Object.values(MatchType),
    required: true,
  })
  matchType: MatchType;

  @Prop({
    type: Number,
    enum: [-1, 1],
    required: true,
  })
  type: Type

  @Prop({ required: true, })
  state: string;
}

export const KeywordSchema = SchemaFactory.createForClass(Keyword);
