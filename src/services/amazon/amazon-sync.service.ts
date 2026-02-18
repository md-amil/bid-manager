import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { AdGroup } from "src/schemas/ad-group.schema";
import { Ad } from "src/schemas/ad.schema";
import { Campaign } from "src/schemas/campaign.schema";
// import { AmazonApiService } from "./amazon-api.service";
import { AmazonMapper } from "./amazon.mapper";
import { CampaignApiService } from "./campaign-api.service";
import { Keyword } from "src/schemas/keyword.schema";
import { Target } from "src/schemas/target.schema";
import { AdGroupApiService } from "./adgroup-api.service";
import { AmazonApiService } from "./amazon-api.service";
import { Profile } from "src/schemas/profile.schema";

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
    @InjectModel(Profile.name)
    private profileModel: Model<Profile>,
    private amazonApi: AmazonApiService,
    private campaignApi: CampaignApiService,
    private adGroupApi: AdGroupApiService,

  ) { }

  async syncCampains(scopeId: string) {
    console.log('Syncing Campaigns...')
    const campaigns = await this.campaignApi.getCampaigns(scopeId);
    console.log(campaigns[0])
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

  async syncAdGroups(scopeId: string,) {
    console.log('Syncing Ad Groups...')
    const adGroups = await this.adGroupApi.getAdGroups(scopeId);
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

  async syncAds(scopeId: string, nextToken?: string) {
    console.log('Syncing Ads...')
    const { productAds, nextToken: next } = await this.adGroupApi.getAds(scopeId, { nextToken });
    console.log(productAds.length, (!!next))
    const adBulkOps = productAds.map(a => ({
      updateOne: {
        filter: { adId: a.adId },
        update: { $set: AmazonMapper.ad(a, scopeId) },
        upsert: true,
      },
    }));
    const adResult = await this.adModel.bulkWrite(adBulkOps);
    if (next) return this.syncAds(scopeId, next)
    return adResult;
  }


  async syncKeywards(scopeId: string, nextToken?: string) {
    console.log('Syncing Keywords...', scopeId)
    const { keywords, nextToken: next } = await this.adGroupApi.getKeywords(scopeId, { nextToken })
    console.log(keywords.length, (!!next))
    const adBulkOps = keywords.map(a => ({
      updateOne: {
        filter: { keywordId: a.keywordId },
        update: { $set: AmazonMapper.keyword(a, scopeId) },
        upsert: true,
      },
    }));
    const keywordResult = await this.keywardModel.bulkWrite(adBulkOps);
    console.log(keywordResult)
    if (next) return await this.syncKeywards(scopeId, next)
    return keywordResult;
  }
  async syncNegativeKeywards(scopeId: string, nextToken?: string) {
    console.log('Syncing Negative Keywords...')
    const { negativeKeywords, nextToken: next } = await this.adGroupApi.getNegativeKeywords(scopeId, { nextToken })
    console.log({ scopeId, negativeKeyword: negativeKeywords.length })
    const adBulkOps = negativeKeywords.map(a => ({
      updateOne: {
        filter: { keywordId: a.keywordId },
        update: { $set: AmazonMapper.keyword(a, scopeId, -1) },
        upsert: true,
      },
    }));
    const negativeKeywordResult = await this.keywardModel.bulkWrite(adBulkOps);
    if (next) return this.syncNegativeKeywards(scopeId, next)
    return negativeKeywordResult;
  }
  async syncTargets(scopeId: string, nextToken?: string) {
    console.log('Syncing Targets...')
    const { targetingClauses, nextToken: next } = await this.adGroupApi.getTargets(scopeId, { nextToken })
    console.log({ targets: targetingClauses.length })
    const adBulkOps = targetingClauses.map(a => ({
      updateOne: {
        filter: { targetId: a.targetId },
        update: { $set: AmazonMapper.target(a, scopeId, 1) },
        upsert: true,
      },
    }));
    const targetResult = await this.targetModel.bulkWrite(adBulkOps);
    if (next) return this.syncTargets(scopeId, next)
    return targetResult;
  }

  async syncNegativeTargets(scopeId: string, nextToken?: string) {
    console.log('Syncing Negative Targets...')
    const { negativeTargetingClauses, nextToken: next } = await this.adGroupApi.getNegativeTargets(scopeId, { nextToken })
    const adBulkOps = negativeTargetingClauses.map(a => ({
      updateOne: {
        filter: { targetId: a.targetId },
        update: { $set: AmazonMapper.target(a, scopeId, -1) },
        upsert: true,
      },
    }));
    const negativeTargetResult = await this.targetModel.bulkWrite(adBulkOps);
    if (next) return this.syncNegativeTargets(scopeId, next)
    return negativeTargetResult;
  }


  async syncProfile(organisationId:string) {
    const profiles = await this.amazonApi.getProfiles()
    const adBulkOps = profiles.map(a => ({
      updateOne: {
        filter: { profileId: a.profileId },
        update: { $set: AmazonMapper.profile(a,organisationId) },
        upsert: true,
      },
    }));
    await this.profileModel.bulkWrite(adBulkOps);
    return profiles
  }

  async syncAll(scopeId: string) {
    // await this.syncCampains(scopeId)
    // await this.syncAdGroups(scopeId)
    // await this.syncAds(scopeId)
    // await this.syncKeywards(scopeId)
    // await this.syncNegativeKeywards(scopeId)
    // await this.syncTargets(scopeId)
    // await this.syncNegativeTargets(scopeId)
    // this.syncNegativeTargets(scopeId)
    // return await Promise.all((await Promise.all([
    //   // [this.adGroupApi.getNegativeKeywords.bind(this.amazonApi), this.syncNegativeKeywards],
    //   // [this.adGroupApi.getTargets.bind(this.amazonApi), this.syncTargets],
    // ].map(async ([fn, target]) => [await fn.call(this, scopeId), target])))
    //   .map(([res, fn]) => fn.call(this, scopeId, res)));

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
