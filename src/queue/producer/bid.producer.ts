import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ReportDocument } from 'src/schemas/report.schema';

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
  scheduleBidAdjustment(reports: ReportDocument[]) {
    const jobs = reports.map(data => ({ name: "process-bid-adjust", data, opts }))
    return this.bidQueue.addBulk(jobs)
  }
}