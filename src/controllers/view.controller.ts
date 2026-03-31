import { Controller, Get, Render, Param, Session, Res, Post, Body, Query } from '@nestjs/common';
import type { Response } from 'express';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Campaign, CampaignDocument } from '../schemas/campaign.schema';
// import { BidAdjustmentLog, BidAdjustmentLogDocument } from '../schemas/bid-adjustment-log.schema';
// import { OptimizationLog, OptimizationLogDocument } from '../schemas/optimization.schema';
import { CampaignReport, ReportDocument } from '../schemas/reports/campaign-report';
import { CampaignService } from 'src/services/campaign.service';
import { ReportService } from 'src/services/report.service';
import { AuthService } from 'src/services/auth.service';
import { SettingService } from 'src/services/setting.service';
import { SyncProducer } from 'src/queue/producer/sync.producer';
import { AdjustmentLog, LogDocument } from 'src/schemas/log.schema';
import { Product, ProductDocument } from 'src/schemas/product.schema';

@Controller()
export class ViewController {
  constructor(
    @InjectModel(Campaign.name) private campaignModel: Model<CampaignDocument>,
    @InjectModel(AdjustmentLog.name) private bidLogModel: Model<LogDocument>,
    // @InjectModel(OptimizationLog.name) private optimizationLogModel: Model<OptimizationLogDocument>,
    @InjectModel(CampaignReport.name) private reportModel: Model<ReportDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    private campaignService: CampaignService,
    private reportService: ReportService,
    private authService: AuthService,
    private settingService: SettingService,
    private readonly syncProducer: SyncProducer
  ) { }

  @Get()
  async getIndex(@Session() session: Record<string, any>, @Res() res: Response) {
    // Check if user is logged in
    if (!session.userId && !session.authenticated) {
      return res.redirect('/auth/login');
    }


    // If logged in but no Amazon account connected, show connect page
    if (session.userId && !session.authenticated) {
      return res.redirect('/auth/connect-amazon');
    }

    if (!session.selectedProfile) {
      return res.redirect('/select-profile');
    }
    const profiles = await this.authService.getProfiles(session.organizationId)

    const selectedProfile = session.selectedProfile;
    const allCampaigns = await this.campaignService.getCampaigns(session.selectedProfile.profileId);
    const campaigns = allCampaigns.filter(campaign =>
      campaign.state?.toLowerCase() === 'enabled'
    );
    const recentLogs = await this.bidLogModel.find({ scopeId: selectedProfile.profileId }).sort({ createdAt: -1 }).limit(10).exec();
    const report = await this.campaignService.getLatestReportSum(allCampaigns.map(c => c.campaignId)) ?? {}

    const stats = {
      totalCampaigns: allCampaigns.length,
      activeCampaigns: campaigns.length,
      totalSpend: report.totalCost ?? 0,
      totalSales: report.totalSales7d ?? 0,
      averageROI: report.totalSales7d / report.totalCost,
      acos14: report.totalCost / report.  totalSales7d * 100
    };

    return res.render('index', {
      campaigns,
      recentLogs,
      stats,
      selectedProfile,
      profiles,
    });
  }

  @Get('campaigns')
  async getCampaigns(
    @Session() session: Record<string, any>,
    @Res() res: Response,
    @Query('status') status: string,
    @Query('name') name: string,
    @Query('targeting') targeting: string
  ) {
    if (!session.userId && !session.authenticated) {
      return res.redirect('/auth/login');
    }

    if (session.userId && !session.authenticated) {
      return res.redirect('/auth/connect-amazon');
    }

    if (!session.selectedProfile) {
      return res.redirect('/select-profile');
    }
    let campaigns = await this.campaignService.getCampaigns(session.selectedProfile.profileId);

    if (status) {
      campaigns = campaigns.filter(campaign =>
        campaign.state.toLowerCase() === status.toLowerCase()
      );
    }
    if (name) {
      campaigns = campaigns.filter(campaign =>
        campaign.name.toLowerCase().includes(name.toLowerCase())
      );
    }
    if (targeting) {
      campaigns = campaigns.filter(campaign =>
        campaign.targetingType && campaign.targetingType.toLowerCase() === targeting.toLowerCase()
      );
    }

    // Fetch latest reports for all campaigns
    const campaignIds = campaigns.map(c => c.campaignId);
    const latestReports = await this.reportService.getLatestCampaignReports(campaignIds);
    const reportMap = new Map(latestReports.map(r => [r.campaignId, r]));
    // console.log(latestReports)
    // Attach metrics to each campaign
    const campaignsWithMetrics = campaigns.map(campaign => {
      const report = reportMap.get(campaign.campaignId);
      return {
        ...campaign.toObject(),
        metrics: report ? {
          impressions: report.impressions || 0,
          clicks: report.clicks || 0,
          cost: report.cost || 0,
          sales7d: report.sales7d || 0,
          sales14d: report.sales14d || 0,
          acos14d: report.sales14d > 0 ? (report.cost / report.sales14d * 100).toFixed(2) : '0.00'
        } : null
      };
    });


    return res.render('campaigns', {
      campaigns: campaignsWithMetrics,
      selectedProfile: session.selectedProfile,
      profiles: session.profiles || [],
      filterStatus: status || '',
      filterName: name || '',
      filterTargeting: targeting || ''
    });
  }

  @Get('campaigns/:id')
  @Render('campaign-detail')
  async getCampaignDetail(
    @Param('id') id: string,
    @Query('period') period: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Session() session: Record<string, any>
  ) {
    let campaign = null as any;
    let adGroups: any[] = [];
    let logs = [];
    let metrics: any = null;

    const selectedPeriod = period || 'daily';
    let dateFilter: any = {};
    let days = 1;
    if (selectedPeriod === 'custom' && startDate && endDate) {
      dateFilter = {
        date: {
          $gte: startDate,
          $lte: endDate
        }
      };
    } else {
      if (selectedPeriod === 'weekly') days = 7;
      if (selectedPeriod === 'monthly') days = 30;
    }
    try {
      campaign = await this.campaignService.getCampaignById(id, ['adgroups', 'adjustmentlogs']);
      adGroups = campaign.adgroups;
      logs = campaign.adjustmentlogs
      let query = this.reportModel.find({
        campaignId: parseInt(id),
        ...dateFilter
      }).sort({ date: -1 });

      if (selectedPeriod !== 'custom') {
        query = query.limit(days);
      }
      const reports = await query.exec();

      if (reports.length > 0) {
        metrics = {
          impressions: reports.reduce((sum, r) => sum + (r.impressions || 0), 0),
          clicks: reports.reduce((sum, r) => sum + (r.clicks || 0), 0),
          spend: reports.reduce((sum, r) => sum + (r.cost || 0), 0),
          sales14d: reports.reduce((sum, r) => sum + (r.sales14d || 0), 0),
          costPerClick: reports.length > 0 ? reports.reduce((sum, r) => sum + (r.cost / r.clicks || 0), 0) / reports.length : 0,
          clickThroughRate: reports.length > 0 ? reports.reduce((sum, r) => sum + (r.clicks / r.impressions || 0), 0) / reports.length : 0,
          roas14d: reports.length > 0 ? reports.reduce((sum, r) => sum + (r.sales14d / r.cost || 0), 0) / reports.length : 0,
          acos14d: reports.length > 0 ? reports.reduce((sum, r) => sum + (r.cost / r.sales14d * 100 || 0), 0) / reports.length : 0,
          conversions14d: reports.reduce((sum, r) => sum + (r.purchases14d / r.clicks || 0), 0),
        };
      }

      // Fetch adgroup reports for metrics
      if (adGroups && adGroups.length > 0) {
        const adGroupIds = adGroups.map(ag => ag.adGroupId);
        const adGroupReports = await this.reportService.getLatestAdGroupReports(adGroupIds);
        const adGroupReportMap = new Map(adGroupReports.map(r => [r.adGroupId, r]));

        // Attach metrics to each adgroup
        adGroups = adGroups.map(adGroup => {
          const report = adGroupReportMap.get(adGroup.adGroupId);
          return {
            ...adGroup,
            metrics: report ? {
              impressions: report.impressions || 0,
              clicks: report.clicks || 0,
              cost: report.cost || 0,
              sales7d: report.sales7d || 0,
              sales14d: report.sales14d || 0,
              acos14d: report.sales14d > 0 ? (report.cost / report.sales14d * 100).toFixed(2) : '0.00'
            } : null
          };
        });
      }
    } catch (error) {
      console.error('Failed to fetch campaign details:', error.message);
    }

    // Fetch optimization logs for this campaign
    // const logs = await this.optimizationLogModel
    //   .find({
    //     entityType: 'CAMPAIGN',
    //     entityId: parseInt(id)
    //   })
    //   .sort({ createdAt: -1 })
    //   .limit(50)
    //   .exec();

    return {
      campaign,
      logs,
      adGroups,
      metrics,
      period: selectedPeriod,
      startDate: startDate || '',
      endDate: endDate || '',
      campaignId: id,
      selectedProfile: session.selectedProfile || null,
      profiles: session.profiles || [],
    };
  }

  @Get('campaigns/:campaignId/adgroups/:adGroupId')
  @Render('adgroup-detail')
  async getAdGroupDetail(
    @Param('campaignId') campaignId: string,
    @Param('adGroupId') adGroupId: string,
    @Query('tab') tab: string,
    @Session() session: Record<string, any>
  ) {
    let productAds;
    let adGroup;
    let keywords = [];
    let negativeKeywords = [];
    let targets = [];
    let campaign = null as any;
    let products = {};
    let searchTerms: any[] = [];
    let targetingReports: any[] = [];

    const selectedTab = tab || 'ads';
    try {
      const reps = await this.campaignService.getAdGroupBy({ adGroupId, campaignId }, ['keywords', 'targets', { from: 'ads.products', field: 'asin' }])
      if (reps.length) {
        const { ads, keywords, targets, ...adGroup } = reps[0]

        // Fetch product details for ASINs
        if (ads && ads.length > 0) {
          const asins = [...new Set(ads.map(ad => ad.asin).filter(Boolean))];
          if (asins.length > 0) {
            const productDocs = await this.productModel.find({ asin: { $in: asins } }).lean();
            products = productDocs.reduce((map, p) => {
              map[p.asin] = p;
              return map;
            }, {});
          }
        }

        // Fetch keyword reports if keywords exist
        let keywordReports: any[] = [];
        if (keywords && keywords.length > 0) {
          const keywordIds = keywords.map(k => k.keywordId);
          keywordReports = await this.reportService.getLatestKeywordReports(keywordIds);
        }

        // Fetch search terms for this adgroup
        searchTerms = await this.reportService.getSearchTermsByAdGroup(adGroupId);

        // Fetch targeting reports by targetIds
        targetingReports = [];
        if (targets && targets.length > 0) {
          const targetIds = targets.map(t => t.targetId);
          targetingReports = await this.reportService.getTargetingReportsByTargetIds(targetIds);
        }

        return {
          productAds: ads,
          keywords,
          keywordReports,
          targets,
          adGroup,
          campaignId,
          products,
          searchTerms,
          targetingReports,
          selectedProfile: session.selectedProfile,
          profiles: session.profiles,
          selectedTab
        }
      }
    } catch (error) {
      console.error('Failed to fetch ad group details:', error.message);
    }

    return {
      campaign,
      campaignId,
      adGroup: adGroup,
      productAds,
      products,
      keywords,
      keywordReports: [],
      negativeKeywords,
      targets,
      searchTerms,
      targetingReports,
      selectedTab,
      selectedProfile: session.selectedProfile || null,
      profiles: session.profiles || [],
    };
  }

  @Get('logs')
  async getLogs(
    @Session() session: Record<string, any>,
    @Res() res: Response,
    @Query('type') type: string,
    @Query('entityType') entityType: string,
    @Query('status') status: string
  ) {
    if (!session.userId && !session.authenticated) {
      return res.redirect('/auth/login');
    }

    if (session.userId && !session.authenticated) {
      return res.redirect('/auth/connect-amazon');
    }

    if (!session.selectedProfile) {
      return res.redirect('/select-profile');
    }
    return res.render('logs', {
      title: 'Logs',
      logs: [],
      campaignMap: new Map(),
      successCount: 0,
      failedCount: 0,
      filterType: '',
      filterEntityType: '',
      filterStatus: '',
      selectedProfile: session.selectedProfile,
      profiles: session.profiles || [],
    });
    const filter: any = {};
    if (type) filter.type = type;
    if (entityType) filter.entityType = entityType;
    if (status) filter.status = status;

    // const logs = await this.optimizationLogModel
    //   .find(filter)
    //   .sort({ createdAt: -1 })
    //   .limit(200)
    //   .exec();

    // const campaignIds = [...new Set(
    //   logs
    //     .filter(log => log.entityType === 'CAMPAIGN')
    //     .map(log => log.entityId)
    // )];

    // const campaigns = await this.campaignModel
    //   .find({ campaignId: { $in: campaignIds } })
    //   .exec();
    // const campaignMap = new Map(
    //   campaigns.map(c => [c.campaignId, c])
    // );

    // const successCount = logs.filter(l => l.status === 'success').length;
    // const failedCount = logs.filter(l => l.status === 'failed').length;

    // return res.render('logs', {
    //   logs,
    //   campaignMap,
    //   successCount,
    //   failedCount,
    //   filterType: type || '',
    //   filterEntityType: entityType || '',
    //   filterStatus: status || '',
    //   selectedProfile: session.selectedProfile,
    //   profiles: session.profiles || [],
    // });
  }

  @Get('select-profile')
  async selectProfilePage(@Session() session: Record<string, any>, @Res() res: Response) {
    if (!session.userId && !session.authenticated) {
      return res.redirect('/auth/login');
    }

    if (session.userId && !session.authenticated) {
      return res.redirect('/auth/connect-amazon');
    }
    const profiles = await this.authService.getProfiles(session.organizationId);
    return res.render('select-profile', {
      title: 'Select Profile',
      profiles: profiles || [],
      selectedProfile: session.selectedProfile || null,
    });
  }

  @Post('select-profile')
  async selectProfile(
    @Body('profileId') profileId: string,
    @Session() session: Record<string, any>,
    @Res() res: Response,
  ) {
    if (!session.userId && !session.authenticated) {
      return res.redirect('/auth/login');
    }

    if (session.userId && !session.authenticated) {
      return res.redirect('/auth/connect-amazon');
    }

    const profiles = await this.authService.getProfiles(session.organizationId)
    const profile = profiles.find(p => p.profileId === profileId);

    if (!profile) return res.redirect('/select-profile?error=profile_not_found');
    session.selectedProfile = profile;

    await this.syncProducer.initializeSyncing({
      accessToken: session.accessToken,
      scopeId: profile.profileId,
    })

    session.save(err => {
      if (err) return console.log(err)
      return res.redirect('/');
    })
  }

  @Get('settings')
  async getSettings(
    @Session() session: Record<string, any>,
    @Res() res: Response,
  ) {
    if (!session.userId && !session.authenticated) {
      return res.redirect('/auth/login');
    }

    if (session.userId && !session.authenticated) {
      return res.redirect('/auth/connect-amazon');
    }

    const profiles = await this.authService.getProfiles(session.organizationId);
    const settings = await this.settingService.getAllSettings(session.organizationId);

    return res.render('settings', {
      settings,
      profiles,
      selectedProfile: session.selectedProfile,
      title: 'Settings',
    });
  }
}
