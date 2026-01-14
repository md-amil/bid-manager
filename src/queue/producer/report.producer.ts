import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { AmazonApiService } from 'src/services/amazon/amazon-api.service';
const defaultOptions = {
  delay: 1000 * 60,
  attempts: 10,
  backoff: {
    type: 'fixed',
    delay: 120_000,
  },
}


const PENDING_REPORT_CODE = '425';

@Injectable()
export class ReportProducer {
  private readonly logger = new Logger(ReportProducer.name);
  constructor(
    @InjectQueue('reportProcessor') private reportQueue: Queue,
    private amazonApi: AmazonApiService
  ) { }

  async generateReport(scopeId:string) {
    this.logger.log('Generating report');
    try {
      const response = await this.amazonApi.generateReport({
        scopeId: scopeId,
        name: "Sponser Report",
        startDate: "2026-01-08",
        endDate: "2026-01-08",
      });
      this.logger.log('Report generated successfully');
      const job = await this.reportQueue.add('generateReport',
        { reportId: response.reportId }, defaultOptions);
      return job;
    } catch (error) {
      if (error.response.data.code == PENDING_REPORT_CODE) {
        const reportId = error.response.data.detail?.split(': ')[1]
        this.logger.log('previous report is already pending passing forward',);
        const job = await this.reportQueue.add('generateReport',
          { reportId },
          defaultOptions);
        return job;
      }
      this.logger.error('Error generating report', error.response.data);
    }
  }
}