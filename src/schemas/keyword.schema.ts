// Keyword {
//   _id,
//   amazonKeywordId,
//   adGroupId,
//   campaignId,
//   profileId,
//   bid,
//   matchType,
//   keywordText
// }
//  "matchType": "EXACT",
//  "state": "ENABLED"

enum MatchType {
  EXACT="EXACT",
  PHRASE="PHRASE",
  BROAD="BROAD"
}


import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

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

  @Prop({ required: true, unique: true })
  bid: string;

  @Prop({ required: true, unique: true })
  matchType: MatchType;

  @Prop({ required: true, unique: true })
  state: string;
}

export const UserSchema = SchemaFactory.createForClass(Keyword);
