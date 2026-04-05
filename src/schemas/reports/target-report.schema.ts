import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { TargetingType } from "src/engine/interfaces";
export type TargetReportDocument = TargetReport & Document;

@Schema({
    collection: 'target_reports',
})
export class TargetReport {
    @Prop({ index: true }) date: string;
    @Prop({ index: true }) targetId: string;
    
    @Prop() keyword: string;
    @Prop() matchType: string
    @Prop() targeting: TargetingType

    @Prop() impressions: number;
    @Prop() clicks: number;
    @Prop() cost: number;

    @Prop() sales1d: number;
    @Prop() sales7d: number;
    @Prop() sales14d: number;

    @Prop() purchases7d: number;
    @Prop() purchases14d: number;

    @Prop() unitsSoldClicks7d: number;
    @Prop() unitsSoldClicks14d: number;
    @Prop() topOfSearchImpressionShare: number;
}

export const TargetReportSchema =
    SchemaFactory.createForClass(TargetReport);