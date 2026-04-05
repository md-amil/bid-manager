import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { CampaignReport } from "src/schemas/reports/campaign-report";
import { KeywordReport } from "src/schemas/reports/keyword-report.schema";
import { TargetReport } from "src/schemas/reports/target-report.schema";
import { SearchTermReport } from "src/schemas/reports/search-term-report.schema";
import { AdReport } from "src/schemas/reports/ad-report.schema";
import { AdGroupReport } from "src/schemas/reports/adgroup-report.schema";
import { Model } from "mongoose";
import { Campaign } from "src/schemas/campaign.schema";
import { IAdFilter, IAdGroupFilter, ICampaignFilter, ICampaignReport, IDateFilter, IKeywordFilter, ISearchTermFilter, ITargetFilter } from "src/interfaces/report.type";
import { AdGroup } from "src/schemas/ad-group.schema";
import { Ad } from "src/schemas/ad.schema";
import { Keyword } from "src/schemas/keyword.schema";
import { Target } from "src/schemas/target.schema";


@Injectable()
export class DataService {
  private readonly logger = new Logger(DataService.name);

  constructor(
    @InjectModel(Campaign.name) private campaign: Model<Campaign>,
    @InjectModel(AdGroup.name) private adGroup: Model<AdGroup>,
    @InjectModel(Keyword.name) private keyword: Model<Keyword>,
    @InjectModel(Target.name) private target: Model<Target>,
    @InjectModel(Ad.name) private ad: Model<Ad>,
    @InjectModel(SearchTermReport.name) private searchReport: Model<SearchTermReport>,

    @InjectModel(CampaignReport.name) private campReport: Model<CampaignReport>,
    @InjectModel(KeywordReport.name) private keyReport: Model<KeywordReport>,
    @InjectModel(TargetReport.name) private targetReport: Model<TargetReport>,
    @InjectModel(AdReport.name) private advertisedProductReport: Model<AdReport>,
    @InjectModel(AdGroupReport.name) private adGroupReport: Model<AdGroupReport>,
  ) { }


  async getCampaigns($match: ICampaignFilter, { $gte, $lte }: IDateFilter, $sort: { state: 1|-1 } = { state: 1 }): Promise<ICampaignReport[]> {
    console.log({ $match, $gte, $lte })
    const campaignWithReport = await this.campaign.aggregate([
      {
        $match
      },
      {
        $lookup: {
          from: 'campaign_reports',
          let: { campaignId: '$campaignId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$campaignId', '$$campaignId'] },
                    { $gte: ['$date', $gte] },
                    { $lte: ['$date', $lte] }
                  ]
                }
              }
            },
            {
              $group: {
                _id: '$campaignId',
                impressions: { $sum: '$impressions' },
                clicks: { $sum: '$clicks' },
                cost: { $sum: '$cost' },
                sales: { $sum: '$sales1d' },
                // sales7d: { $sum: '$sales7d' },
                // sales14d: { $sum: '$sales14d' },
                // purchases1d: { $sum: '$purchases1d' },
                // purchases7d: { $sum: '$purchases7d' },
                // purchases14d: { $sum: '$purchases14d' }
              }
            }
          ],
          as: 'metrics'
        }
      },
      {
        $unwind: {
          path: '$metrics',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $addFields: {
          metrics: { $ifNull: ['$metrics', {
            impressions: 0,
            clicks: 0,
            cost: 0,
            sales: 0
          }] }
        }
      },
      {
        $sort: $sort
      }
    ]);
    return campaignWithReport
  }

  async getAdgroup($match:IAdGroupFilter, { $gte, $lte }: IDateFilter){
    $match.campaignId='235882805467163'
    return await this.adGroup.aggregate([
      {
        $match:{...$match}
      },
      {
        $lookup: {
          from: 'adgroup_reports',
          let: { adGroupId: '$adGroupId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$adGroupId', '$$adGroupId'] },
                    { $gte: ['$date', $gte] },
                    { $lte: ['$date', $lte] }
                  ]
                }
              }
            },
            {
              $group: {
                _id: '$adGroupId',
                impressions: { $sum: '$impressions' },
                clicks: { $sum: '$clicks' },
                cost: { $sum: '$cost' },
                sales: { $sum: '$sales1d' },
              }
            }
          ],
          as: 'report'
        }
      },
      {
        $unwind: {
          path: '$report',
          preserveNullAndEmptyArrays: true
        }
      },
    ]);
  }

  async getAds($match:IAdFilter, { $gte, $lte }: IDateFilter){
    $match.adGroupId='496910876282744'
    const ads = await this.ad.aggregate([
      {
        $match
      },
      {
        $lookup: {
          from: 'ad_reports',
          let: { adId: '$adId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$adId', '$$adId'] },
                    { $gte: ['$date', $gte] },
                    { $lte: ['$date', $lte] }
                  ]
                }
              }
            },
            {
              $group: {
                _id: '$adId',
                impressions: { $sum: '$impressions' },
                clicks: { $sum: '$clicks' },
                cost: { $sum: '$cost' },
                sales: { $sum: '$sales1d' },
              }
            }
          ],
          as: 'report'
        }
      },
      {
        $unwind: {
          path: '$report',
          preserveNullAndEmptyArrays: true
        }
      },
    ]);
    return ads
  }

  async getKeywords($match: IKeywordFilter, { $gte, $lte }: IDateFilter) {
    $match.adGroupId='323531413557908'
    return await this.keyword.aggregate([
      { $match },
      {
        $lookup: {
          from: 'keyword_reports',
          let: { keywordId: '$keywordId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$keywordId', '$$keywordId'] },
                    { $gte: ['$date', $gte] },
                    { $lte: ['$date', $lte] }
                  ]
                }
              }
            },
            {
              $group: {
                _id: '$keywordId',
                impressions: { $sum: '$impressions' },
                clicks: { $sum: '$clicks' },
                cost: { $sum: '$cost' },
                sales: { $sum: '$sales1d' },
              }
            }
          ],
          as: 'report'
        }
      },
      {
        $unwind: {
          path: '$report',
          preserveNullAndEmptyArrays: true
        }
      },
    ]);
  }

  async getTargeting($match: ITargetFilter, { $gte, $lte }: IDateFilter) {
    return await this.target.aggregate([
      { $match },
      {
        $lookup: {
          from: 'target_reports',
          let: { targetId: '$targetId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$targetId', '$$targetId'] },
                    { $gte: ['$date', $gte] },
                    { $lte: ['$date', $lte] }
                  ]
                }
              }
            },
            {
              $group: {
                _id: '$targetId',
                impressions: { $sum: '$impressions' },
                clicks: { $sum: '$clicks' },
                cost: { $sum: '$cost' },
                sales: { $sum: '$sales1d' },
                targeting: { $first: '$targeting' },
              }
            }
          ],
          as: 'metrics'
        }
      },
      {
        $unwind: {
          path: '$metrics',
          preserveNullAndEmptyArrays: true
        }
      },
    ]);
  }

  async getSearchTerm($match: ISearchTermFilter, dateFilter: IDateFilter){
    $match.campaignId='235882805467163'
    return this.searchReport.aggregate([
      {
        $match: {
          ...$match,
          date: dateFilter
        }
      },
      {
        $group: {
          _id: '$searchTerm',
          impressions: { $sum: '$impressions' },
          clicks: { $sum: '$clicks' },
          cost: { $sum: '$cost' },
          sales1d: { $sum: '$sales1d' },
          sales7d: { $sum: '$sales7d' },
          sales14d: { $sum: '$sales14d' },
          purchases1d: { $sum: '$purchases1d' },
          purchases7d: { $sum: '$purchases7d' },
          purchases14d: { $sum: '$purchases14d' },
          keywordId: { $first: '$keywordId' },
          keyword: { $first: '$keyword' },
          matchType: { $first: '$matchType' },
          searchTerm: { $first: '$searchTerm' }
        }
      },
      {
        $sort: { cost: -1 }
      }
    ]);
    // return await this.searchReport.aggregate([
    //   { $match },
    //   {
    //     $lookup: {
    //       from: 'search_term_reports',
    //       let: { searchTermId: '$searchTermId' },
    //       pipeline: [
    //         {
    //           $match: {
    //             $expr: {
    //               $and: [
    //                 { $eq: ['$searchTermId', '$$searchTermId'] },
    //                 { $gte: ['$date', $gte] },
    //                 { $lte: ['$date', $lte] }
    //               ]
    //             }
    //           }
    //         },
    //         {
    //           $group: {
    //             _id: '$searchTermId',
    //             impressions: { $sum: '$impressions' },
    //             clicks: { $sum: '$clicks' },
    //             cost: { $sum: '$cost' },
    //             sales: { $sum: '$sales1d' },
    //           }
    //         }
    //       ],
    //       as: 'report'
    //     }
    //   },
    //   {
    //     $unwind: {
    //       path: '$report',
    //       preserveNullAndEmptyArrays: true
    //     }
    //   },
    // ]);
  }
}