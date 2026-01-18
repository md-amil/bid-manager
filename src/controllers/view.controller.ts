import { Controller, Get, Render, Param, Session, Res, Post, Body, Query } from '@nestjs/common';
import type { Response } from 'express';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Campaign, CampaignDocument } from '../schemas/campaign.schema';
import { BidAdjustmentLog, BidAdjustmentLogDocument } from '../schemas/bid-adjustment-log.schema';
import { OptimizationLog, OptimizationLogDocument } from '../schemas/optimization.schema';
import { CampaignReport, ReportDocument } from '../schemas/report.schema';
import { Keyword, KeywordDocument } from '../schemas/keyword.schema';
import { Target, TargetDocument } from '../schemas/target.schema';
import { AmazonApiService } from '../services/amazon/amazon-api.service';
import { CampaignService } from 'src/services/campaign.service';
import { Ad, AdDocument } from 'src/schemas/ad.schema';

@Controller()
export class ViewController {
  constructor(
    @InjectModel(Campaign.name) private campaignModel: Model<CampaignDocument>,
    @InjectModel(Ad.name) private adModal: Model<AdDocument>,
    @InjectModel(BidAdjustmentLog.name) private bidLogModel: Model<BidAdjustmentLogDocument>,
    @InjectModel(OptimizationLog.name) private optimizationLogModel: Model<OptimizationLogDocument>,
    @InjectModel(CampaignReport.name) private reportModel: Model<ReportDocument>,
    @InjectModel(Keyword.name) private keywordModel: Model<KeywordDocument>,
    @InjectModel(Target.name) private targetModel: Model<TargetDocument>,
    private amazonApiService: AmazonApiService,
    private campaignService: CampaignService,
  ) { }

  @Get()
  async getIndex(@Session() session: Record<string, any>, @Res() res: Response) {
    if (!session.authenticated) {
      return res.redirect('/auth/login');
    }

    if (!session.selectedProfile) {
      return res.redirect('/select-profile');
    }

    const selectedProfile = session.selectedProfile;
    const campaigns = await this.campaignService.getCampaigns(session.selectedProfile.profileId);
    const recentLogs = await this.bidLogModel.find().sort({ createdAt: -1 }).limit(10).exec();

    const stats = {
      totalCampaigns: campaigns.length,
      activeCampaigns: campaigns.filter(c => c.state === 'ENABLED').length,
      totalSpend: campaigns.reduce((sum, c) => sum + c.spend, 0),
      totalSales: campaigns.reduce((sum, c) => sum + c.sales, 0),
      averageROI: 0
      // averageROI: campaigns.length > 0 
      //   ? campaigns.reduce((sum, c) => sum + (c.roi || 0), 0) / campaigns.length 
      //   : 0,
    };
    return res.render('index', {
      campaigns,
      recentLogs,
      stats,
      selectedProfile,
      profiles: session.profiles || [],
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

    if (!session.authenticated) {
      return res.redirect('/auth/login');
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

    return res.render('campaigns', {
      campaigns,
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
    let adGroups = [];
    let metrics = null as any;
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
      campaign = await this.campaignService.getCampaignById(id);
      adGroups = campaign.adGroups;
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
          spend: reports.reduce((sum, r) => sum + (r.spend || 0), 0),
          cost: reports.reduce((sum, r) => sum + (r.cost || 0), 0),
          sales14d: reports.reduce((sum, r) => sum + (r.attributedSalesSameSku14d || 0), 0),
          costPerClick: reports.length > 0 ? reports.reduce((sum, r) => sum + (r.costPerClick || 0), 0) / reports.length : 0,
          clickThroughRate: reports.length > 0 ? reports.reduce((sum, r) => sum + (r.clickThroughRate || 0), 0) / reports.length : 0,
          roas14d: reports.length > 0 ? reports.reduce((sum, r) => sum + (r.roasClicks14d || 0), 0) / reports.length : 0,
          acos14d: reports.length > 0 ? reports.reduce((sum, r) => sum + (r.acosClicks14d || 0), 0) / reports.length : 0,
          conversions14d: reports.reduce((sum, r) => sum + (r.purchasesSameSku14d || 0), 0),
        };
      }
    } catch (error) {
      console.error('Failed to fetch campaign details:', error.message);
    }

    // Fetch optimization logs for this campaign
    const logs = await this.optimizationLogModel
      .find({
        entityType: 'CAMPAIGN',
        entityId: parseInt(id)
      })
      .sort({ createdAt: -1 })
      .limit(50)
      .exec();

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

    const selectedTab = tab || 'ads';
    console.log("profile", session.selectedProfile)

    try {
      const reps = await this.campaignService.getAdGroupBy({ adGroupId, campaignId }, ['keywords', 'ads', 'targets'])
      console.log({ group: reps[0] })
      if (reps.length) {
        const { ads, keywords, targets, ...adGroup } = reps[0]
        return {
          productAds: ads,
          keywords,
          targets,
          adGroup,
          campaignId,
          selectedProfile: session.selectedProfile,
          profiles: session.profiles,
          selectedTab
        }
        // 
        // adGroup = group;
        // productAds = ads;
        // targets=targets
        // // Combine all keywords (both positive and negative) for the keywords tab
        // const allKeywords = keywords || [];
        // keywords = allKeywords; // Show all keywords in the keywords tab
        // negativeKeywords = []; // Keep empty for backward compatibility
      }
      console.log({ keywords: keywords.length, targets: targets.length, adGroup })
      // Note: Negative keywords would need a separate API endpoint
      // For now, we'll use an empty array as placeholder
      // negativeKeywords = [];
    } catch (error) {
      console.error('Failed to fetch ad group details:', error.message);
    }

    return {
      campaign,
      campaignId,
      adGroup: adGroup,
      productAds,
      keywords,
      negativeKeywords,
      targets,
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
    if (!session.authenticated) {
      return res.redirect('/auth/login');
    }

    if (!session.selectedProfile) {
      return res.redirect('/select-profile');
    }
    const filter: any = {};
    if (type) filter.type = type;
    if (entityType) filter.entityType = entityType;
    if (status) filter.status = status;

    const logs = await this.optimizationLogModel
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(200)
      .exec();

    const campaignIds = [...new Set(
      logs
        .filter(log => log.entityType === 'CAMPAIGN')
        .map(log => log.entityId)
    )];

    const campaigns = await this.campaignModel
      .find({ campaignId: { $in: campaignIds } })
      .exec();
    const campaignMap = new Map(
      campaigns.map(c => [c.campaignId, c])
    );

    const successCount = logs.filter(l => l.status === 'success').length;
    const failedCount = logs.filter(l => l.status === 'failed').length;

    return res.render('logs', {
      logs,
      campaignMap,
      successCount,
      failedCount,
      filterType: type || '',
      filterEntityType: entityType || '',
      filterStatus: status || '',
      selectedProfile: session.selectedProfile,
      profiles: session.profiles || [],
    });
  }

  @Get('select-profile')
  async selectProfilePage(@Session() session: Record<string, any>, @Res() res: Response) {
    // Check if user is authenticated
    if (!session.authenticated) {
      return res.redirect('/auth/login');
    }

    return res.render('select-profile', {
      title: 'Select Profile',
      profiles: session.profiles || [],
      selectedProfile: session.selectedProfile || null,
    });
  }

  @Post('select-profile')
  async selectProfile(
    @Body('profileId') profileId: string,
    @Session() session: Record<string, any>,
    @Res() res: Response,
  ) {
    if (!session.authenticated || !session.profiles) {
      return res.redirect('/auth/login');
    }

    const profile = session.profiles.find(p => p.profileId.toString() === profileId);

    if (!profile) {
      return res.redirect('/select-profile?error=profile_not_found');
    }

    session.selectedProfile = profile;
    return res.redirect('/');
  }
}
