import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
// import { ReportDocument } from 'src/schemas/reports/report.schema';
// import { CampaignService } from 'src/services/campaign.service';
// import { CampaignApiService } from 'src/services/amazon/campaign-api.service';

const opts = {
  attempts: 3,
  backoff: { type: "exponential", delay: 5000 },
  removeOnComplete: true,
}


@Injectable()
export class BidProducer {
  private readonly logger = new Logger(BidProducer.name);
  constructor(
    @InjectQueue('bidProcessor') private bidQueue: Queue,
  ) { }

  async scheduleBidAdjustment(reports: { campaignId: string }[],budgetUsages?:any) {
    // return this.bidQueue.add( "analyze",  { campaignId:'93618166928305',budgetUsages }, opts )
    const jobs = reports.map(({ campaignId }) => ({ name: "analyze", data: { campaignId }, opts }))
    return this.bidQueue.addBulk(jobs)
  }
}