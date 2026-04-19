import { Controller, Get, Render, Param, Session, Res, Post, Body, Query } from '@nestjs/common';
import type { Response } from 'express';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Campaign, CampaignDocument } from '../schemas/campaign.schema';
import { CampaignReport, ReportDocument } from '../schemas/reports/campaign-report';
import { CampaignService } from 'src/services/campaign.service';
import { ReportService } from 'src/services/report.service';
import { AuthService } from 'src/services/auth.service';
import { SettingService } from 'src/services/setting.service';
import { SyncProducer } from 'src/queue/producer/sync.producer';
import { AdjustmentLog, LogDocument } from 'src/schemas/log.schema';
import { Product, ProductDocument } from 'src/schemas/product.schema';
import { buildQueryWindow } from 'src/utils/query';
import { AdjustmentLogService } from 'src/services/log.service';
import { DataService } from 'src/services/data.service';

@Controller()
export class ViewController {
  constructor(
    @InjectModel(Campaign.name) private campaignModel: Model<CampaignDocument>,
    @InjectModel(AdjustmentLog.name) private bidLogModel: Model<LogDocument>,
    @InjectModel(CampaignReport.name) private reportModel: Model<ReportDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    private campaignService: CampaignService,
    private reportService: ReportService,
    private authService: AuthService,
    private settingService: SettingService,
    private logService: AdjustmentLogService,
    private readonly syncProducer: SyncProducer,
    private readonly dataService: DataService
  ) { }

  @Get()
  async getIndex(@Session() session: Record<string, any>, @Res() res: Response) {
    const profiles = await this.authService.getProfiles(session.organizationId)
    const selectedProfile = session.selectedProfile;
    const allCampaigns = await this.campaignService.getCampaigns(session.selectedProfile.profileId);
    const campaigns = allCampaigns.filter(campaign =>
      campaign.state === 'ENABLED'
    );
    const recentLogs = await this.logService.getLogsBy({ scopeId: selectedProfile.profileId });
    // const recentLogs = await this.bidLogModel.find({ scopeId: selectedProfile.profileId }).sort({ createdAt: -1 }).limit(10).exec();
    const report = await this.campaignService.getLatestReportSum(allCampaigns.map(c => c.campaignId)) ?? {}

    // Create campaignMap for log display
    const campaignMap = new Map();
    allCampaigns.forEach(campaign => {
      campaignMap.set(campaign.campaignId, campaign);
    });

    const stats = {
      totalCampaigns: allCampaigns.length,
      activeCampaigns: campaigns.length,
      totalSpend: report.totalCost ?? 0,
      totalSales: report.totalSales7d ?? 0,
      averageROI: report.totalCost > 0 ? report.totalSales7d / report.totalCost : 0,
      acos14: report.totalSales7d > 0 ? report.totalCost / report.totalSales7d * 100 : 0
    };

    return res.render('index', {
      campaigns,
      recentLogs,
      stats,
      selectedProfile,
      profiles,
      campaignMap,
    });
  }

  @Get('campaigns')
  async getCampaigns(
    @Session() session: Record<string, any>,
    @Res() res: Response,
    @Query('status') status: string,
    @Query('name') name: string,
    @Query('targeting') targeting: string,
    // @Query('period') period: string,
    // @Query('startDate') startDate: string,
    // @Query('endDate') endDate: string
  ) {
    const match = {
      scopeId: session.scopeId,
      ...(status ? { state: status?.toUpperCase() } : {}),
      ...(name ? { name: { $regex: name, $options: 'i' } } : {}),
      ...(targeting ? { targetingType: targeting?.toUpperCase() } : {}),
    }
    let campaigns = await this.dataService.getCampaigns(match, session.dateWindow);
    // Calculate date range based on period (use session if no query param)
    // const sessionDateFilter = session.dateFilter;
    // const selectedPeriod = period || sessionDateFilter?.period || 'today';
    // const effectiveStartDate = startDate || sessionDateFilter?.startDate;
    // const effectiveEndDate = endDate || sessionDateFilter?.endDate;

    // const today = new Date().toISOString().split('T')[0];
    // let dateStart = '';
    // let dateEnd = today;

    // if (selectedPeriod === 'custom' && effectiveStartDate && effectiveEndDate) {
    //   dateStart = effectiveStartDate;
    //   dateEnd = effectiveEndDate;
    // } else {
    //   const now = new Date();
    //   switch (selectedPeriod) {
    //     case 'today':
    //       dateStart = today;
    //       break;
    //     case 'yesterday':
    //       const yesterday = new Date(now);
    //       yesterday.setDate(yesterday.getDate() - 1);
    //       dateStart = yesterday.toISOString().split('T')[0];
    //       dateEnd = dateStart;
    //       break;
    //     case 'last7days':
    //       const d7 = new Date(now);
    //       d7.setDate(d7.getDate() - 6);
    //       dateStart = d7.toISOString().split('T')[0];
    //       break;
    //     case 'last30days':
    //       const d30 = new Date(now);
    //       d30.setDate(d30.getDate() - 29);
    //       dateStart = d30.toISOString().split('T')[0];
    //       break;
    //     case 'thisWeek':
    //       const weekStart = new Date(now);
    //       const day = weekStart.getDay();
    //       const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
    //       weekStart.setDate(diff);
    //       dateStart = weekStart.toISOString().split('T')[0];
    //       break;
    //     case 'lastWeek':
    //       const lastWeekStart = new Date(now);
    //       const lastDay = lastWeekStart.getDay();
    //       const lastDiff = lastWeekStart.getDate() - lastDay - 6;
    //       lastWeekStart.setDate(lastDiff);
    //       dateStart = lastWeekStart.toISOString().split('T')[0];
    //       const lastWeekEnd = new Date(lastWeekStart);
    //       lastWeekEnd.setDate(lastWeekEnd.getDate() + 6);
    //       dateEnd = lastWeekEnd.toISOString().split('T')[0];
    //       break;
    //     case 'thisMonth':
    //       dateStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    //       break;
    //     case 'lastMonth':
    //       const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    //       dateStart = lastMonthStart.toISOString().split('T')[0];
    //       const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    //       dateEnd = lastMonthEnd.toISOString().split('T')[0];
    //       break;
    //     default:
    //       dateStart = today;
    //   }
    // }

    // Fetch aggregated reports for the date range
    // const campaignIds = campaigns.map(c => c.campaignId);
    // const reports = await this.reportService.getCampaignReportsByDateRange(campaignIds, dateStart, dateEnd);
    // const reportMap = new Map(reports.map(r => [String(r.campaignId), r]));

    // Attach metrics to each campaign
    // const campaignsWithMetrics = campaigns.map(campaign => {
    //   const report = reportMap.get(String(campaign.campaignId));
    //   return {
    //     ...campaign,
    //     metrics: report ? {
    //       impressions: report.impressions || 0,
    //       clicks: report.clicks || 0,
    //       cost: report.cost || 0,
    //       sales: report.sales1d || 0,
    //       acos: report.sales1d > 0 ? ((report.cost / report.sales1d) * 100).toFixed(2) : '0.00',
    //       roas: report.cost > 0 ? (report.sales1d / report.cost).toFixed(2) : '0.00',
    //     } : null
    //   };
    // });


    return res.render('campaigns', {
      campaigns: campaigns,
      selectedProfile: session.selectedProfile,
      profiles: session.profiles || [],
      filterStatus: status || '',
      filterName: name || '',
      filterTargeting: targeting || '',
      // filterPeriod: selectedPeriod,
      // filterStartDate: effectiveStartDate || '',
      // filterEndDate: effectiveEndDate || '',
      // dateStart,
      // dateEnd,
      getDateFilterLabel: (period: string, start: string, end: string) => {
        const labels: Record<string, string> = {
          'today': 'Today',
          'yesterday': 'Yesterday',
          'last7days': 'Last 7 days',
          'thisWeek': 'This week',
          'lastWeek': 'Last week',
          'last30days': 'Last 30 days',
          'thisMonth': 'This month',
          'lastMonth': 'Last month',
          'custom': `${start} to ${end}`
        };
        return labels[period] || 'Today';
      }
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

    // Use session date filter if no query params provided
    const sessionDateFilter = session.dateFilter;
    const selectedPeriod = period || sessionDateFilter?.period || 'daily';
    const effectiveStartDate = startDate || sessionDateFilter?.startDate;
    const effectiveEndDate = endDate || sessionDateFilter?.endDate;

    let dateFilter = {}
    if (selectedPeriod === 'custom' && effectiveStartDate && effectiveEndDate) {
      dateFilter = { $gte: effectiveStartDate, $lte: effectiveEndDate }
    } else {
      const window = {
        'monthly': 29,
        'last30days': 29,
        'weekly': 6,
        'last7days': 6,
        'daily': 0
      }
      dateFilter = buildQueryWindow(window[selectedPeriod])
      // const windowDays = selectedPeriod === 'monthly' || selectedPeriod === 'last30days' ? 29 : 
      // selectedPeriod === 'weekly' || selectedPeriod === 'last7days' ? 6 : 0;
      // const dateRange = buildQueryWindow(  windowDays);
      // dateStart = dateRange.$gte;
      // dateEnd = dateRange.$lte;
    }

    try {
      campaign = await this.campaignService.getCampaignById(id, ['adgroups', 'adjustmentlogs']);
      adGroups = campaign.adgroups;
      logs = campaign.adjustmentlogs;


      // Get aggregated campaign metrics using report service
      metrics = await this.reportService.getCampaignReportAggregated(id, dateFilter);

      // Map cost to spend and sales1d to sales for template compatibility
      metrics.spend = metrics.cost;
      metrics.sales = metrics.sales1d;
      metrics.conversions = metrics.purchases1d;
      // Fetch adgroup reports for metrics with date filter
      if (adGroups && adGroups.length > 0) {
        const adGroupIds = adGroups.map(ag => String(ag.adGroupId));
        const adGroupReports = await this.reportService.getAdGroupReportsByDateRange(adGroupIds, dateFilter);
        const adGroupReportMap = new Map(adGroupReports.map(r => [String(r.adGroupId), r]));
        // Attach metrics to each adgroup
        adGroups = adGroups.map(adGroup => {
          const report = adGroupReportMap.get(String(adGroup.adGroupId));
          return {
            ...adGroup,
            metrics: report ? {
              impressions: report.impressions || 0,
              clicks: report.clicks || 0,
              cost: report.cost || 0,
              sales1d: report.sales1d || 0,
              acos: report.sales1d > 0 ? (report.cost / report.sales1d * 100).toFixed(2) : '0.00',
              roas: report.cost > 0 ? (report.sales1d / report.cost).toFixed(2) : '0.00'
            } : null
          };
        });
      }
    } catch (error) {
      console.error('Failed to fetch campaign details:', error.message);
    }
    return {
      campaign,
      logs,
      adGroups,
      metrics,
      period: selectedPeriod,
      startDate: effectiveStartDate,
      endDate: effectiveEndDate,
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
    @Query('period') period: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
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

    // Calculate date range based on period (use session if no query params)
    const sessionDateFilter = session.dateFilter;
    const selectedPeriod = period || sessionDateFilter?.period || 'today';
    const effectiveStartDate = startDate || sessionDateFilter?.startDate;
    const effectiveEndDate = endDate || sessionDateFilter?.endDate;

    let dateStart: string;
    let dateEnd: string;

    if (selectedPeriod === 'custom' && effectiveStartDate && effectiveEndDate) {
      dateStart = effectiveStartDate;
      dateEnd = effectiveEndDate;
    } else if (selectedPeriod === 'yesterday') {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      dateStart = yesterday.toISOString().split('T')[0];
      dateEnd = dateStart;
    } else {
      const windowDays = selectedPeriod === 'last30days' ? 29 :
        selectedPeriod === 'last7days' ? 6 : 0;
      const dateRange = buildQueryWindow(windowDays);
      dateStart = dateRange.$gte;
      dateEnd = dateRange.$lte;
    }

    try {
      // Get campaign to check targeting type
      campaign = await this.campaignModel.findOne({ campaignId }).lean();

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
        // Fetch keyword reports if keywords exist (only for manual campaigns)
        let keywordReports: any[] = [];
        if (keywords && keywords.length > 0 && campaign?.targetingType === 'MANUAL') {
          const keywordIds = keywords.map(k => k.keywordId);
          keywordReports = await this.reportService.getLatestKeywordReports(keywordIds);
        }

        searchTerms = await this.reportService.getSearchTermsByAdGroupAndDateRange(adGroupId, dateStart, dateEnd);

        targetingReports = [];
        if (targets && targets.length > 0) {
          const targetIds = targets.map(t => t.targetId);
          targetingReports = await this.reportService.getTargetingReportsByTargetIdsAndDateRange(targetIds, { $gte: dateStart, $lte: dateEnd });
        }

        return {
          productAds: ads,
          keywords,
          keywordReports,
          targets,
          adGroup,
          campaignId,
          campaign,
          products,
          searchTerms,
          targetingReports,
          selectedProfile: session.selectedProfile,
          profiles: session.profiles,
          selectedTab,
          filterPeriod: selectedPeriod,
          filterStartDate: effectiveStartDate || '',
          filterEndDate: effectiveEndDate || '',
          dateStart,
          dateEnd,
          getDateFilterLabel: (period: string, start: string, end: string) => {
            const labels: Record<string, string> = {
              'today': 'Today',
              'yesterday': 'Yesterday',
              'last7days': 'Last 7 days',
              'thisWeek': 'This week',
              'lastWeek': 'Last week',
              'last30days': 'Last 30 days',
              'thisMonth': 'This month',
              'lastMonth': 'Last month',
              'custom': `${start} to ${end}`
            };
            return labels[period] || 'Today';
          }
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
      filterPeriod: selectedPeriod,
      filterStartDate: effectiveStartDate || '',
      filterEndDate: effectiveEndDate || '',
      dateStart,
      dateEnd,
    };
  }

  @Get('logs')
  async getLogs(
    @Session() session: Record<string, any>,
    @Res() res: Response
  ) {
    const filter: any = { scopeId: session.scopeId };

    const logs = await this.logService.getLogsBy(filter, 200);

    const logCampaignIds = [...new Set(
      logs
        .filter(log => log.campaignId)
        .map(log => log.campaignId)
    )];

    const campaigns = await this.campaignModel
      .find({ campaignId: { $in: logCampaignIds } })
      .exec();
    const campaignMap = new Map(
      campaigns.map(c => [c.campaignId, c])
    );

    return res.render('logs', {
      logs,
      campaignMap,
      selectedProfile: session.selectedProfile,
      profiles: session.profiles || [],
    });
  }

  @Post('api/logs/clear')
  async clearLogs(
    @Session() session: Record<string, any>,
    @Res() res: Response
  ) {
    try {
      await this.logService.deleteLogsByScope(session.scopeId);
      return res.json({ success: true, message: 'Logs cleared successfully' });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to clear logs' });
    }
  }

  @Get('account')
  async getAccountPage(@Session() session: Record<string, any>, @Res() res: Response) {
    try {
      // Get organization details
      const organization = await this.authService.getOrganization({ _id: session.userId });
      // Get all profiles for this organization
      const profiles = await this.authService.getProfiles(session.organizationId);
      // Get settings
      const settings = await this.settingService.getAllSettings(session.organizationId);

      return res.render('account', {
        title: 'Account',
        organization,
        profiles: profiles || [],
        settings,
        selectedProfile: session.selectedProfile,
        userId: session.userId,
        userName: session.userName,
        userEmail: session.userEmail,
      });
    } catch (error) {
      console.error('Error loading account page:', error);
      return res.redirect('/');
    }
  }

  @Get('select-profile')
  async selectProfilePage(@Session() session: Record<string, any>, @Res() res: Response) {
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
    const profiles = await this.authService.getProfiles(session.organizationId)
    const profile = profiles.find(p => p.profileId === profileId);

    if (!profile) return res.redirect('/select-profile?error=profile_not_found');
    session.selectedProfile = profile;

    await this.syncProducer.initializeSyncing({
      accessToken: session.accessToken,
      scopeId: profile.profileId,
    })

    session.save(err => {
      if (err) {
        console.log(err);
        return res.redirect('/select-profile?error=session_save_failed');
      }
      return res.redirect('/');
    });
  }

  @Get('settings')
  async getSettings(
    @Session() session: Record<string, any>,
    @Res() res: Response,
  ) {
    // Redirect to account page which now includes settings
    return res.redirect('/account');
  }
}
