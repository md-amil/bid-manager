import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { AdGroup } from "src/schemas/ad-group.schema";
import { Ad } from "src/schemas/ad.schema";
import { Campaign } from "src/schemas/campaign.schema";
import { AmazonApiService } from "./amazon-api.service";
import { AmazonMapper } from "./amazon.mapper";
import { CampaignApiService } from "./campaign-api.service";
import { Keyword } from "src/schemas/keyword.schema";
import { Target } from "src/schemas/target.schema";
import { AdGroupApiService } from "./adgroup-api.service";

@Injectable()
export class AmazonSyncService {
  constructor(
    @InjectModel(Campaign.name)
    private campaignModel: Model<Campaign>,
    @InjectModel(AdGroup.name)
    private adGroupModel: Model<AdGroup>,
    @InjectModel(Ad.name)
    private adModel: Model<Ad>,
    @InjectModel(Keyword.name)
    private keywardModel: Model<Keyword>,
    @InjectModel(Target.name)
    private targetModel: Model<Target>,
    private amazonApi: AmazonApiService,
    private campaignApi: CampaignApiService,
    private adGroupApi: AdGroupApiService,

  ) { }

  async syncCampains(scopeId: string, campaigns: any[]) {
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

  async syncAdGroups(scopeId: string, adGroups: any[]) {
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

  async syncAds(scopeId: string, ads: any[]) {
    const adBulkOps = ads.map(a => ({
      updateOne: {
        filter: { adId: a.adId },
        update: { $set: AmazonMapper.ad(a, scopeId) },
        upsert: true,
      },
    }));
    const adResult = await this.adModel.bulkWrite(adBulkOps);
    return adResult;
  }


  async syncKeywards(scopeId: string, keywords: any[]) {
    const adBulkOps = keywords.map(a => ({
      updateOne: {
        filter: { keywordId: a.keywordId },
        update: { $set: AmazonMapper.keyword(a, scopeId) },
        upsert: true,
      },
    }));
    return this.keywardModel.bulkWrite(adBulkOps);
  }
  async syncNegativeKeywards(scopeId: string, keywords: any[]) {
    console.log({scopeId,negativeKeyword:keywords.length})
    const adBulkOps = keywords.map(a => ({
      updateOne: {
        filter: { keywordId: a.keywordId },
        update: { $set: AmazonMapper.keyword(a, scopeId, -1) },
        upsert: true,
      },
    }));
    return this.keywardModel.bulkWrite(adBulkOps);
  }
  async syncTargets(scopeId: string, targets: any[]) {
    console.log({scopeId,targets:targets.length})
    const adBulkOps = targets.map(a => ({
      updateOne: {
        filter: { targetId: a.targetId },
        update: { $set: AmazonMapper.keyword(a, scopeId, 1) },
        upsert: true,
      },
    }));
    return this.targetModel.bulkWrite(adBulkOps);
  }

  async syncNegativeTargets(scopeId: string, targets: any[]) {
        console.log({scopeId,negative:targets.length})

    const adBulkOps = targets.map(a => ({
      updateOne: {
        filter: { targetId: a.targetId },
        update: { $set: AmazonMapper.target(a, scopeId, -1) },
        upsert: true,
      },
    }));
    return this.targetModel.bulkWrite(adBulkOps);
  }

  async syncAll(scopeId: string) {
    // const [campaigns, adGroups, ads, keywards, negativeKeywords] = await Promise.all([
    //   this.campaignApi.getCampaigns,
    //   this.amazonApi.getAdGroups,
    //   this.amazonApi.getAds,
    //   this.amazonApi.getKeywords,
    //   this.amazonApi.getKeywords
    // ].map(fn=>fn.call(this,scopeId)))

    return await Promise.all((await Promise.all([
      // [this.campaignApi.getCampaigns.bind(this.campaignApi), this.syncCampains],
      // [this.amazonApi.getAdGroups.bind(this.amazonApi), this.syncAdGroups],
      // [this.amazonApi.getAds.bind(this.amazonApi), this.syncAds],
      // [this.amazonApi.getKeywords.bind(this.amazonApi), this.syncKeywards],
      [this.adGroupApi.getNegativeKeywords.bind(this.amazonApi),this.syncNegativeKeywards],
      [this.adGroupApi.getTargets.bind(this.amazonApi),this.syncTargets],
      [this.adGroupApi.getNegativeTargets.bind(this.amazonApi),this.syncNegativeTargets]
    ].map(async ([fn, target]) => [await fn.call(this, scopeId), target])))
    .map(([res, fn]) => fn.call(this, scopeId, res)));

    // return await Promise.all(results)
    // const rs = targets.map(async (fn,i)=>({[fn.name.replace('sync','')]:await fn.call(this,scopeId,results[i])}))
    // console.log({rs})
    // return rs
    // const campaigns = await this.campaignApi.getCampaigns(scopeId);
    // const adGroups = await this.amazonApi.getAdGroups(scopeId);
    // const ads = await this.amazonApi.getAds(scopeId);
    // const keywards = await this.amazonApi.getKeywords(scopeId)
    // console.log('Ads:', ads.length)
    // console.log('Ad Groups:', adGroups.length)
    // console.log('Campaigns:', campaigns[0])
    // const campResult = await this.syncCampains(scopeId, campaigns);
    // const resultAdGroup = await this.syncAdGroups(scopeId, adGroups);
    // const resultAds = await this.syncAds(scopeId, ads);
    // const keywardsResult = await this.syncKeywards(scopeId, keywards)
    // const negativeResult = await this.syncNegativeKeywards(scopeId, negativeKeywords)
    // return { campaign: campResult, adGroup: resultAdGroup, ads: resultAds, keywards: keywardsResult, negativeKeywords: negativeResult }
  }
}
