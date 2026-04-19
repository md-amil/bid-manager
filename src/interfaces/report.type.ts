import { TargetingType } from "src/engine/interfaces";
import { Campaign } from "src/schemas/campaign.schema";
import { Target } from "src/schemas/target.schema";

export interface IBaseReport{
    impressions: number;
    clicks: number;
    cost: number;
    sales: number;
}


export interface  Targeting extends Target {
    metrics: IBaseReport &{
        targeting:TargetingType
    };
}

export type IDateFilter = {
   $gte?: string, $lte?: string 
}


export type ICampaignFilter = {
    scopeId?: string;
    state?: string;
    name?:any
    targetingType?:string
}


export interface IAdGroupFilter {
    campaignId?: string;
}

export interface IAdFilter {
    campaignId?: string;
    adGroupId?: string;
}

export interface IKeywordFilter {
    campaignId?: string;
    adGroupId?: string;
}

export interface ITargetFilter {
    campaignId?: string;
    adGroupId?: string;
}

export interface ISearchTermFilter {
    campaignId?: string[] | string;
    adGroupId?: string;
    targeting?: string;
    keywordId?: string;
}


export type ICampaignReport = IBaseReport&Campaign;
