import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
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
import { Product } from "src/schemas/product.schema";
import { IAmazonAuth } from "src/interfaces/index.type";


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
    @InjectModel(Product.name)
    private productModel: Model<Product>,
    private amazonApi: AmazonApiService,
    private campaignApi: CampaignApiService,
    private adGroupApi: AdGroupApiService,

  ) { }

  async syncCampains(auth: IAmazonAuth) {
    console.log('Syncing Campaigns...')
    const campaigns = await this.campaignApi.getCampaigns(auth);
    const campaignBulkOps = campaigns.map(c => ({
      updateOne: {
        filter: { campaignId: c.campaignId },
        update: { $set: AmazonMapper.campaign(c, auth.scopeId) },
        upsert: true,
      },
    }));
    const campaignResult = await this.campaignModel.bulkWrite(campaignBulkOps);
    return campaignResult;
  }

  async syncAdGroups(auth: IAmazonAuth,) {
    console.log('Syncing Ad Groups...')
    const adGroups = await this.adGroupApi.getAdGroups(auth);
    const adGroupBulkOps = adGroups.map(g => ({
      updateOne: {
        filter: { adGroupId: g.adGroupId },
        update: { $set: AmazonMapper.adGroup(g, auth.scopeId) },
        upsert: true,
      },
    }));
    const adGroupResult = await this.adGroupModel.bulkWrite(adGroupBulkOps);
    return adGroupResult;
  }

  async syncAds(auth: IAmazonAuth, nextToken?: string) {
    console.log('Syncing Ads...')
    const { productAds, nextToken: next } = await this.adGroupApi.getAds(auth, { nextToken });
    console.log(productAds.length, (!!next))
    const adBulkOps = productAds.map(a => ({
      updateOne: {
        filter: { adId: a.adId },
        update: { $set: AmazonMapper.ad(a, auth.scopeId) },
        upsert: true,
      },
    }));
    const adResult = await this.adModel.bulkWrite(adBulkOps);
    if (next) return this.syncAds(auth, next)
    return adResult;
  }


  async syncKeywards(auth: IAmazonAuth, nextToken?: string) {
    const { keywords, nextToken: next } = await this.adGroupApi.getKeywords(auth, { nextToken })
    console.log('Syncing Keywords...', keywords.length, (!!next))

    const adBulkOps = keywords.map(a => ({
      updateOne: {
        filter: { keywordId: a.keywordId },
        update: { $set: AmazonMapper.keyword(a, auth.scopeId) },
        upsert: true,
      },
    }));
    const keywordResult = await this.keywardModel.bulkWrite(adBulkOps);
    if (next) return await this.syncKeywards(auth, next)
    return keywordResult;
  }
  async syncNegativeKeywards(auth: IAmazonAuth, nextToken?: string) {
    console.log('Syncing Negative Keywords...')
    const { negativeKeywords, nextToken: next } = await this.adGroupApi.getNegativeKeywords(auth, { nextToken })
    console.log({ scopeId: auth.scopeId, negativeKeyword: negativeKeywords.length })
    const adBulkOps = negativeKeywords.map(a => ({
      updateOne: {
        filter: { keywordId: a.keywordId },
        update: { $set: AmazonMapper.keyword(a, auth.scopeId, -1) },
        upsert: true,
      },
    }));
    const negativeKeywordResult = await this.keywardModel.bulkWrite(adBulkOps);
    if (next) return this.syncNegativeKeywards(auth, next)
    return negativeKeywordResult;
  }
  async syncTargets(auth: IAmazonAuth, nextToken?: string) {
    console.log('Syncing Targets...')
    const { targetingClauses, nextToken: next } = await this.adGroupApi.getTargets(auth, { nextToken })
    const adBulkOps = targetingClauses.map(a => ({
      updateOne: {
        filter: { targetId: a.targetId },
        update: { $set: AmazonMapper.target(a, auth.scopeId, 1) },
        upsert: true,
      },
    }));
    const targetResult = await this.targetModel.bulkWrite(adBulkOps);
    if (next) return this.syncTargets(auth, next)
    return targetResult;
  }

  async syncNegativeTargets(auth: IAmazonAuth, nextToken?: string) {
    console.log('Syncing Negative Targets...')
    const { negativeTargetingClauses, nextToken: next } = await this.adGroupApi.getNegativeTargets(auth, { nextToken })
    console.log()
    const adBulkOps = negativeTargetingClauses.map(a => ({
      updateOne: {
        filter: { targetId: a.targetId },
        update: { $set: AmazonMapper.target(a, auth.scopeId, -1) },
        upsert: true,
      },
    }));
    const negativeTargetResult = await this.targetModel.bulkWrite(adBulkOps);
    if (next) return this.syncNegativeTargets(auth, next)
    return negativeTargetResult;
  }


  async syncProfile(organisationId:Types.ObjectId) {
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

  async syncProducts(auth: IAmazonAuth) {
    console.log('Syncing Products...')
    const response = await this.amazonApi.getProductMeta(auth);
    if (!response) {
      console.log('No products found');
      return null;
    }
    
    const productBulkOps = response.map(p => ({
      updateOne: {
        filter: { asin: p.asin },
        update: { $set: AmazonMapper.product(p, auth.scopeId) },
        upsert: true,
      },
    }));
    const productResult = await this.productModel.bulkWrite(productBulkOps);
    return productResult;
  }

  async syncAll(auth: IAmazonAuth) {
    // await this.syncCampains(auth)
    // await this.syncAdGroups(auth)
    // await this.syncAds(auth)
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
