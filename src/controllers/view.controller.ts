import { Controller, Get, Render, Param, Session, Res, Post, Body } from '@nestjs/common';
import type { Response } from 'express';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Campaign, CampaignDocument } from '../schemas/campaign.schema';
import { BidAdjustmentLog, BidAdjustmentLogDocument } from '../schemas/bid-adjustment-log.schema';
import { BidAdjustmentService } from 'src/services/bid-adjustment.service';

@Controller()
export class ViewController {
  constructor(
    @InjectModel(Campaign.name) private campaignModel: Model<CampaignDocument>,
    @InjectModel(BidAdjustmentLog.name) private bidLogModel: Model<BidAdjustmentLogDocument>,
    private aadService: BidAdjustmentService,
    
  ) {}

  @Get()
  async getIndex(@Session() session: Record<string, any>, @Res() res: Response) {
    // Check if user is authenticated
    if (!session.authenticated) {
      return res.redirect('/auth/login');
    }

    // Check if profile is selected
    if (!session.selectedProfile) {
      return res.redirect('/select-profile');
    }

    const selectedProfile = session.selectedProfile;
    const campaigns = await this.campaignModel.find().sort({ createdAt: -1 }).exec();
    const recentLogs = await this.bidLogModel.find().sort({ createdAt: -1 }).limit(10).exec();
    
    const stats = {
      totalCampaigns: campaigns.length,
      activeCampaigns: campaigns.filter(c => c.status === 'active').length,
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
    // Check if user is authenticated
    if (!session.authenticated) {
      return res.redirect('/auth/login');
    }

    // Check if profile is selected
    if (!session.selectedProfile) {
      return res.redirect('/select-profile');
    }

    // const campaigns = await this.campaignModel.find().sort({ createdAt: -1 }).exec();
    const campaigns = await this.aadService.syncCampaignData();
    return res.render('campaigns', { 
      campaigns,
      selectedProfile: session.selectedProfile,
      profiles: session.profiles || [],
    });
  }

  @Get('campaigns/:id')
  @Render('campaign-detail')
  async getCampaignDetail(@Param('id') id: string) {
    const campaign = await this.campaignModel.findOne({ campaignId: id }).exec();
    const logs = await this.bidLogModel
      .find({ campaignId: id })
      .sort({ createdAt: -1 })
      .exec();
    
    return { campaign, logs };
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
