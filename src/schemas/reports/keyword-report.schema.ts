import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type KeywordReportDocument = KeywordReport & Document;
@Schema({
  collection: 'keyword_reports',
})
export class KeywordReport {
  @Prop({ index: true }) date: string;

  @Prop({ index: true }) keywordId: string;
  @Prop() keyword: string;
  @Prop() matchType: string;

  @Prop() impressions: number;
  @Prop() clicks: number;
  @Prop() cost: number;

  @Prop() sales7d: number;
  @Prop() sales14d: number;

  @Prop() purchases7d: number;
  @Prop() purchases14d: number;

  @Prop() unitsSoldClicks7d: number;
  @Prop() unitsSoldClicks14d: number;
  @Prop() topOfSearchImpressionShare: number;
  @Prop({ default: 'INR' }) currency: string;
}

export const KeywordReportSchema = SchemaFactory.createForClass(KeywordReport);
