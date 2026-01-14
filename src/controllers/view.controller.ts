import { Controller, Get, Render, Param, Session, Res, Post, Body, Query } from '@nestjs/common';
import type { Response } from 'express';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Campaign, CampaignDocument } from '../schemas/campaign.schema';
import { BidAdjustmentLog, BidAdjustmentLogDocument } from '../schemas/bid-adjustment-log.schema';
import { CampaignReport, CampaignReportDocument } from '../schemas/report.schema';
import { AmazonApiService } from '../services/amazon/amazon-api.service';
import { CampaignService } from 'src/services/campaign.service';

@Controller()
export class ViewController {
  constructor(
    @InjectModel(Campaign.name) private campaignModel: Model<CampaignDocument>,
    @InjectModel(BidAdjustmentLog.name) private bidLogModel: Model<BidAdjustmentLogDocument>,
    @InjectModel(CampaignReport.name) private reportModel: Model<CampaignReportDocument>,
    private amazonApiService: AmazonApiService,
    private campaignService: CampaignService,
  ) {}

  @Get()
  async getIndex(@Session() session: Record<string, any>, @Res() res: Response) {
    console.log({session:session.authenticated})
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
      averageROI: campaigns.length > 0 
        ? campaigns.reduce((sum, c) => sum + (c.roi || 0), 0) / campaigns.length 
        : 0,
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
  async getCampaigns(@Session() session: Record<string, any>, @Res() res: Response) {
    if (!session.authenticated) {
      return res.redirect('/auth/login');
    }
    if (!session.selectedProfile) {
      return res.redirect('/select-profile');
    }
    const campaigns = await this.campaignService.getCampaigns(session.selectedProfile.profileId??'3838241482724308');
    return res.render('campaigns', { 
      campaigns,
      selectedProfile: session.selectedProfile,
      profiles: session.profiles || [],
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
    console.log({session})
    let campaign = null as any;
    let adGroups = [];
    let metrics = null as any;
    
    // Set default period to daily if not specified
    const selectedPeriod = period || 'daily';
    
    let dateFilter: any = {};
    let days = 1; // daily
    
    // Handle custom date range
    if (selectedPeriod === 'custom' && startDate && endDate) {
      dateFilter = {
        date: {
          $gte: startDate,
          $lte: endDate
        }
      };
    } else {
      // Calculate days based on period
      if (selectedPeriod === 'weekly') days = 7;
      if (selectedPeriod === 'monthly') days = 30;
    }
    
    try {
      campaign = await this.campaignService.getCampaignById(id);
      adGroups = campaign.adGroups;
      
      // Fetch campaign metrics from reports based on selected period
      let query = this.reportModel.find({ 
        campaignId: parseInt(id),
        ...dateFilter
      }).sort({ date: -1 });
      
      // Apply limit only if not custom date range
      if (selectedPeriod !== 'custom') {
        query = query.limit(days);
      }
      
      const reports = await query.exec();
      
      // Aggregate metrics from reports
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
    
    // Also check local database for bid adjustment logs
    const logs = await this.bidLogModel
      .find({ campaignId: id })
      .sort({ createdAt: -1 })
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
    let productAds = [];
    let keywords = [];
    let negativeKeywords = [];
    let campaign = null as any;
    
    const selectedTab = tab || 'ads';
    
    try {
      // Fetch campaign details
      campaign = await this.campaignModel.findOne({ campaignId }).exec();
      
      // Fetch product ads from Amazon API
      productAds = await this.amazonApiService.getProductAdsByAdGroup(adGroupId);
      
      // Fetch keywords (targeting)
      keywords = await this.amazonApiService.getKeywords('3838241482724308', {
        adGroupId: [adGroupId]
      });
      
      // Note: Negative keywords would need a separate API endpoint
      // For now, we'll use an empty array as placeholder
      negativeKeywords = [];
    } catch (error) {
      console.error('Failed to fetch ad group details:', error.message);
    }
    
    return {
      campaign,
      campaignId,
      adGroup: { adGroupId },
      productAds,
      keywords,
      negativeKeywords,
      selectedTab,
      selectedProfile: session.selectedProfile || null,
      profiles: session.profiles || [],
    };
  }

  @Get('logs')
  async getLogs(@Session() session: Record<string, any>, @Res() res: Response) {
    // Check if user is authenticated
    if (!session.authenticated) {
      return res.redirect('/auth/login');
    }

    // Check if profile is selected
    if (!session.selectedProfile) {
      return res.redirect('/select-profile');
    }

    const logs = await this.bidLogModel
      .find()
      .sort({ createdAt: -1 })
      .limit(100)
      .exec();
    
    const successCount = logs.filter(l => l.status === 'success').length;
    const failedCount = logs.filter(l => l.status === 'failed').length;
    
    return res.render('logs', { 
      logs, 
      successCount, 
      failedCount,
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
