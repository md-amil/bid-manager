import { Controller, Get, Post, Delete, Body, Param, Request, Req } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Campaign, CampaignDocument, Type } from '../schemas/campaign.schema';
import { AdjustmentLog, LogDocument } from '../schemas/log.schema';
import { ReportProducer } from 'src/queue/producer/report.producer';
import { CampaignApiService } from 'src/services/amazon/campaign-api.service';
import { BidProducer } from 'src/queue/producer/bid.producer';
import { CampaignService } from 'src/services/campaign.service';
import { SyncProducer } from 'src/queue/producer/sync.producer';
import { DataService } from 'src/services/data.service';
import { buildQueryWindow } from 'src/utils/query';
import DailyRuleEngine from 'src/engine/core/daily-rule.engine';


@Controller('api/campaigns')
export class CampaignController {
  constructor(
    private campaignApi: CampaignApiService,
    private readonly syncProducer: SyncProducer,
    private readonly reportProducer: ReportProducer,
    private readonly bidProducer: BidProducer,
    private readonly campaignService: CampaignService,
    private readonly dataService:DataService,
    private readonly dailyRuleEngine: DailyRuleEngine,
    @InjectModel(Campaign.name) private campaignModel: Model<CampaignDocument>,
    @InjectModel(AdjustmentLog.name) private bidLogModel: Model<LogDocument>,
  ) { }

  @Get('test')
  async getCampaignTypes() {
    return this.dataService.getSearchTerm({ },buildQueryWindow(30))
    return this.dataService.getTargeting({ },buildQueryWindow(30))
    return this.dataService.getKeywords({ },buildQueryWindow(30))
    return this.dataService.getAds({ },buildQueryWindow(30))
    return this.dataService.getCampaigns({ },buildQueryWindow(30))
    return this.dataService.getAdgroup({  },buildQueryWindow(30))
  }

  @Get()
  async getAllCampaigns(@Req() request: any) {
    const scopeId = request.session.selectedProfile?.profileId
    if(scopeId) {
      return this.campaignModel.find({ scopeId }).exec();
    }
    return this.campaignModel.find({ state:'ENABLED' }).exec();
  }

  @Post()
  async createCampaign(@Body() campaignData: any) {
    const campaign = new this.campaignModel(campaignData);
    return await campaign.save();
  }

  @Post('report-sync')
  async reportSync() {
    const reportJob = await this.reportProducer.generateReport(7);
    return { message: 'Report sync initiated', jobIds: reportJob?.map(j => j.id).join(',') };
  }

  @Post('sync')
  async campaignSync() {
    const job = await this.syncProducer.syncCampaignData()
    return { message: 'Campaign sync initiated', job: job.id };
  }

  @Post('adjust-bids')
  async adjustBids(@Request() req: any) {
    const scopeId = req.session.selectedProfile?.profileId
    const accessToken = req.session?.accessToken;
    const campaigns = (await this.campaignService.getCampaigns(scopeId)).filter(c => c.state === "ENABLED")
    // const budgetUsages = await this.campaignApi.getBudgetUses(['340981085273491'], {scopeId,accessToken})
    await this.bidProducer.scheduleBidAdjustment(campaigns);
    return { message: 'Bid adjustment scheduled' };
  }

  @Post('daily-adjust')
  async dailyAdjust(@Request() req: any) {
    const scopeId = req.session.selectedProfile?.profileId;
    const accessToken = req.session?.accessToken;
    
    if (!scopeId || !accessToken) {
      return { success: false, message: 'No profile selected or access token missing' };
    }

    try {
      await this.dailyRuleEngine.run({ scopeId, accessToken });
      return { success: true, message: 'Daily adjustment completed' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @Post(':id/optimize')
  async scheduleCampaignAdjustment(@Param('id') id: string, @Request() req: any) {
    // const scopeId = req.session.selectedProfile?.profileId;
    const campaign = await this.campaignModel.findOne({ campaignId: id }).exec();
    if (!campaign) {
      return { success: false, message: 'Campaign not found' };
    }

    if (campaign.state !== 'ENABLED') {
      return { success: false, message: 'Campaign must be enabled to schedule adjustment' };
    }

    await this.bidProducer.scheduleBidAdjustment([campaign]);
    return { success: true, message: `Adjustment scheduled for campaign ${campaign.name}` };
  }

  @Get(':id')
  async getCampaign(@Param('id') id: string) {
    return await this.campaignModel.findOne({ campaignId: id }).exec();
  }

  @Get(':id/logs')
  async getCampaignLogs(@Param('id') id: string, @Req() req: any) {
    const scopeId = req.session.selectedProfile?.profileId;
    return await this.bidLogModel
      .find({ campaignId: id, scopeId })
      .sort({ createdAt: -1 })
      .limit(50)
      .exec();
  }

  @Get('logs/recent')
  async getRecentLogs(@Req() req: any) {
    const scopeId = req.session.selectedProfile?.profileId;
    return await this.bidLogModel
      .find({ scopeId })
      .sort({ createdAt: -1 })
      .limit(100)
      .exec();
  }

  @Delete(':id/logs')
  async clearCampaignLogs(@Param('id') id: string, @Req() req: any) {
    const scopeId = req.session.selectedProfile?.profileId;

    if (!scopeId) {
      return { success: false, message: 'No profile selected' };
    }

    try {
      const result = await this.bidLogModel.deleteMany({ campaignId: id, scopeId }).exec();
      return {
        success: true,
        message: `Cleared ${result.deletedCount} optimization logs`,
        deletedCount: result.deletedCount
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @Get('decide-budget')
  async calculateBudget() {
    // return this.bidService.budgetDisicion(json[0] as any)
  }
}
