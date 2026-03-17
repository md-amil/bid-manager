import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage } from 'mongoose';
import { Campaign, CampaignDocument } from 'src/schemas/campaign.schema';
import { AdGroup, AdGroupDocument } from 'src/schemas/ad-group.schema';
import { CampaignReport, ReportDocument } from 'src/schemas/reports/campaign-report';
import { SearchTermDocument, SearchTermReport } from 'src/schemas/reports/search-term-report.schema';

@Injectable()
export class CampaignService {
  private readonly logger = new Logger(CampaignService.name);

  constructor(
    @InjectModel(Campaign.name) private campaignModel: Model<CampaignDocument>,
    @InjectModel(AdGroup.name) private adgroup: Model<AdGroupDocument>,
    @InjectModel(CampaignReport.name) private report: Model<ReportDocument>,
    @InjectModel(SearchTermReport.name) private searchReport: Model<SearchTermDocument>,
  ) { }

  // async syncCampaignData(scopeId: string = '3838241482724308'): Promise<any> {
  //   this.logger.log('Syncing campaign data from Amazon API');
  //   try {
  //     const endDate = new Date().toISOString();
  //     const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  //     const job = await this.syncQueue.add('sync', {
  //       scopeId,
  //       endDate,
  //       startDate,
  //     });
  //     return job;
  //   } catch (error) {
  //     this.logger.error('Error syncing campaign data',);
  //   }
  // }

  async getSearchTermReport(campaignId: string) {
    const response = await this.searchReport.aggregate([
      {
        $match: { campaignId },
      },
      {
        $sort: { date: -1 },
      },
      {
        $group: {
          _id: '$campaignId',
          latestDate: { $first: '$date' },
          docs: { $push: '$$ROOT' },
        },
      },
      {
        $project: {
          _id: 0,
          latestDate: 1,
          searchTerms: {
            $filter: {
              input: '$docs',
              as: 'doc',
              cond: { $eq: ['$$doc.date', '$latestDate'] },
            },
          },
        },
      },
    ]);
    return response[0]?.searchTerms || [];
  }


  async findCampaignBundle(campaignId: string) {

    const keywordQuery: PipelineStage = {
      $lookup: {
        from: 'keywords',
        let: { campaignId: '$campaignId' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$campaignId', '$$campaignId'] },
            },
          },
          {
            $lookup: {
              from: 'keyword_reports',
              let: { keywordId: '$keywordId' },
              pipeline: [
                {
                  $match: {
                    $expr: { $eq: ['$keywordId', '$$keywordId'] },
                  },
                },
                { $sort: { date: -1 } },
                { $limit: 1 },
              ],
              as: 'metrics',
            },
          },
          {
            $unwind: {
              path: '$metrics',
              preserveNullAndEmptyArrays: true,
            },
          },
        ],
        as: 'keywords',
      },
    }

    const targetQuery: PipelineStage = {
      $lookup: {
        from: 'targets',
        let: { campaignId: '$campaignId' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$campaignId', '$$campaignId'] },
            },
          },
          {
            $lookup: {
              from: 'target_reports',
              let: { targetId: '$targetId' },
              pipeline: [
                {
                  $match: {
                    $expr: { $eq: ['$targetId', '$$targetId'] },
                  },
                },
                { $sort: { date: -1 } },
                { $limit: 1 },
              ],
              as: 'metrics',
            },
          },
          {
            $unwind: {
              path: '$metrics',
              preserveNullAndEmptyArrays: true,
            },
          },
        ],
        as: 'targets',
      },
    }


    const response = await this.campaignModel.aggregate([
      {
        $match: { campaignId },
      },
      {
        $lookup: {
          from: 'campaign_reports',
          let: { campaignId: '$campaignId' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$campaignId', '$$campaignId'] },
              },
            },
            { $sort: { date: -1 } },
            { $limit: 1 },
          ],
          as: 'matrics',
        },
      },
      {
        $unwind: {
          path: '$matrics',
          preserveNullAndEmptyArrays: true,
        },
      },
      keywordQuery,
      targetQuery
    ]);
    return response[0]
  }


  async getCampaigns(scopeId: string) {
    return this.campaignModel.find({ scopeId }).sort({ createdAt: -1 }).exec();
  }

  async getCampaignById(campaignId: string, populates: string[]) {
    const match: any = { campaignId };
    return this.getCampaignBy(match, populates)
    // const query: PipelineStage[] = [
    //   {
    //     $match: {
    //       campaignId
    //     }
    //   },
    // ]
    // populates.forEach(from => {
    //   query.push(
    //     {
    //       $lookup: {
    //         from,
    //         localField: 'campaignId',
    //         foreignField: 'campaignId',
    //         as: from
    //       }
    //     },
    //   )
    // })
    // const data = await this.campaignModel.aggregate(query);
    // return data[0];
  }

  async getCampaignBy($match: PipelineStage.Match, populate: string[]) {
    const pipeline: PipelineStage[] = [{ $match }]
    for (const pop of populate) {
      pipeline.push({
        $lookup: {
          from: pop,
          localField: 'campaignId',
          foreignField: 'campaignId',
          as: pop,
        },
      })
    }
    const data = await this.campaignModel.aggregate(pipeline);
    return data[0];
  }

  async getAdGroupBy($match, populate: (string | { from: string, field: string })[]) {
    const args: any[] = [{ $match }]
    for (const pop of populate) {
      if (typeof pop === 'string') {
        args.push({
          $lookup: {
            from: pop,
            localField: 'adGroupId',
            foreignField: 'adGroupId',
            as: pop,
          },
        })
      }
      if (typeof pop === 'object') {
        const [parent, child] = pop.from.split('.')
        args.push({
          $lookup: {
            from: parent,
            localField: "adGroupId",
            foreignField: "adGroupId",
            as: parent,
            pipeline: [
              {
                $lookup: {
                  from: child,
                  localField: pop.field,
                  foreignField: pop.field,
                  as: child,
                },
              },
            ],
          },
        })
      }

    }
    return this.adgroup.aggregate(args)
  }

  async getLatestReportSum(campaignIds: string[]) {
    const result = await this.report.aggregate([
      {
        $match: {
          campaignId: { $in: campaignIds }
        }
      },
      { $sort: { date: -1 } },
      {
        $group: {
          _id: "$date",
          spend: { $sum: "$spend" },
          sales7d: { $sum: "$sales7d" }
        }
      },
      {
        $group: {
          _id: null,
          totalSpend: { $sum: "$spend" },
          totalSales7d: { $sum: "$sales7d" }
        }
      }
    ]);
    return result[0]
  }

  // async generateReport() {
  //   this.logger.log('Generating report');
  //   try {
  //     const job = await this.reportQueue.add('generateReport', {
  //       name: "sponser report",
  //       startDate: "2026-01-04",
  //       endDate: "2026-01-07",
  //     });
  //     return job;
  //   } catch (error) {
  //     this.logger.error('Error generating report', error);
  //   }
  // }
}