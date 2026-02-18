import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

export type SearchTermDocument = SearchTermReport & Document;
@Schema({
    collection: 'searchterm_reports',
})
export class SearchTermReport {
    @Prop({ index: true }) date: string;
    @Prop({ index: true }) keywordId: string;
    @Prop() campaignId: string; 
    @Prop() adGroupId: string; 
    
    @Prop() matchType: string;
    @Prop() keyword: string;
    @Prop() searchTerm: string; 
    @Prop() keywordType: string; 
    @Prop() targeting: string; 

    @Prop() impressions: number;
    @Prop() clicks: number;
    @Prop() cost: number;

    @Prop() sales7d: number;
    @Prop() sales14d: number;

    @Prop() purchases7d: number;
    @Prop() purchases14d: number;

    @Prop({ default: "INR" }) currency: string;
}


        

export const SearchTermReportSchema =
  SchemaFactory.createForClass(SearchTermReport);