import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { AdGroup } from "src/schemas/ad-group.schema";
import { Ad } from "src/schemas/ad.schema";
import { Campaign } from "src/schemas/campaign.schema";
import { AmazonApiService } from "./amazon-api.service";
import { AmazonMapper } from "./amazon.mapper";

@Injectable()
export class AmazonSyncService {
  constructor(
    @InjectModel(Campaign.name)
    private campaignModel: Model<Campaign>,

    @InjectModel(AdGroup.name)
    private adGroupModel: Model<AdGroup>,

    @InjectModel(Ad.name)
    private adModel: Model<Ad>,

    private amazonApi: AmazonApiService,
  ) {}

   async syncCampains(scopeId:string,campaigns:any[]) {
    // const campaigns = await this.amazonApi.getCampaigns(scopeId);
    const campaignBulkOps = campaigns.map(c => ({
      updateOne: {
        filter: { campaignId: c.campaignId },
        update: { $set: AmazonMapper.campaign(c, scopeId) },
        upsert: true,
      },
    }));
    const campaignResult = await this.campaignModel.bulkWrite(campaignBulkOps);
    return campaignResult;
  }

  async syncAdGroups(scopeId:string,adGroups:any[]) {
    const adGroupBulkOps = adGroups.map(g => ({
      updateOne: {
        filter: { adGroupId: g.adGroupId },
        update: { $set: AmazonMapper.adGroup(g, scopeId) },
        upsert: true,
      },
    }));
    const adGroupResult = await this.adGroupModel.bulkWrite(adGroupBulkOps);
    return adGroupResult;
  }

  async syncAds(scopeId:string,ads:any[]) {
    const adBulkOps = ads.map(a => ({
      updateOne: {
        filter: { adId: a.adId },
        update: { $set: AmazonMapper.ad(a,  scopeId) },
        upsert: true,
      },
    }));
    const adResult = await this.adModel.bulkWrite(adBulkOps);
    return adResult;
  }

  async syncAll(scopeId: string) {
    const campaigns = await this.amazonApi.getCampaigns(scopeId);
    const campaignIds = campaigns.map(c => c.campaignId);
    const adGroups = await this.amazonApi.getAdGroups(
      scopeId,
      {campaignId: campaignIds},
    );
    const ads = await this.amazonApi.getAds(
      scopeId,
      {campaignId: campaignIds}, 
    );
    console.log('Ads:', ads.length)
    console.log('Ad Groups:', adGroups.length)
    console.log('Campaigns:', campaigns[0])
    const campResult = await this.syncCampains(scopeId,campaigns);
    const resultAdGroup = await this.syncAdGroups(scopeId,adGroups);
    const resultAds = await this.syncAds(scopeId,ads);
    return {campaign:campResult,adGroup:resultAdGroup,ads:resultAds}
  }
}
