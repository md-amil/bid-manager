import { Controller, Get, Post, Body, Param, Request, Req } from '@nestjs/common';
import {  InjectModel } from '@nestjs/mongoose';
import {  Model } from 'mongoose';
import { Campaign, CampaignDocument, Type } from '../schemas/campaign.schema';
import { AdjustmentLog, LogDocument } from '../schemas/log.schema';
// import { AmazonApiService } from 'src/services/amazon/amazon-api.service';
// import { SyncProducer } from 'src/queue/producer/sync.producer';
import { ReportProducer } from 'src/queue/producer/report.producer';
// import { BidService } from 'src/services/amazon/bid.service';
// import { ReportDocument } from 'src/schemas/reports/report.schema';
import { CampaignApiService } from 'src/services/amazon/campaign-api.service';
import { BidProducer } from 'src/queue/producer/bid.producer';
import { CampaignService } from 'src/services/campaign.service';
import { SyncProducer } from 'src/queue/producer/sync.producer';


@Controller('api/campaigns')
export class CampaignController {
  constructor(
    // private campaignService: CampaignService,
    private campaignApi: CampaignApiService,
    private readonly syncProducer: SyncProducer,
    private readonly reportProducer: ReportProducer,
    private readonly bidProducer: BidProducer,
    private readonly campaignService: CampaignService,
    // private readonly bidService: BidService,
    @InjectModel(Campaign.name) private campaignModel: Model<CampaignDocument>,
    @InjectModel(AdjustmentLog.name) private bidLogModel: Model<LogDocument>,
  ) { }

  @Get()
  async getAllCampaigns(@Req() request: any) {
    const scopeId = request.session.selectedProfile?.profileId
    return this.campaignModel.find({ scopeId }).exec();
    // return await this.campaignApi.getCampaigns();
  }

  @Post()
  async createCampaign(@Body() campaignData: any) {
    const campaign = new this.campaignModel(campaignData);
    return await campaign.save();
  }

  @Post('report-sync')
  async reportSync() {
    const reportJob = await this.reportProducer.generateReport();
    return { message: 'Report sync initiated',jobIds: reportJob?.map(j=>j.id).join(',') };
  }

  @Post('sync')
  async campaignSync() {
   const job  =  await this.syncProducer.syncCampaignData()
    return { message: 'Campaign sync initiated', job:job.id};
  }

  @Post('adjust-bids')
  async adjustBids(@Request() req: any) {
    const scopeId = req.session.selectedProfile?.profileId
    const accessToken = req.session?.accessToken;
    const campaigns = (await this.campaignService.getCampaigns(scopeId)).filter(c=>c.state === "ENABLED"&& c.campaignId=='235882805467163')
    // const budgetUsages = await this.campaignApi.getBudgetUses(['340981085273491'], {scopeId,accessToken})
    // console.log(campaigns.length, "campaign length", budgetUsages.length)
    await this.bidProducer.scheduleBidAdjustment(campaigns);
    return { message: 'Bid adjustment scheduled' };
  }

  @Get(':id')
  async getCampaign(@Param('id') id: string) {

    return await this.campaignModel.findOne({ campaignId: id }).exec();
  }

  @Get(':id/logs')
  async getCampaignLogs(@Param('id') id: string) {
    return await this.bidLogModel
      .find({ campaignId: id })
      .sort({ createdAt: -1 })
      .limit(50)
      .exec();
  }

  @Get('logs/recent')
  async getRecentLogs() {
    return await this.bidLogModel
      .find()
      .sort({ createdAt: -1 })
      .limit(100)
      .exec();
  }


  @Get('decide-budget')
  async calculateBudget() {
    // return this.bidService.budgetDisicion(json[0] as any)
  }
}
