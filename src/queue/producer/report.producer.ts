import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { CampaignApiService } from 'src/services/amazon/campaign-api.service';
import { AdGroupApiService } from 'src/services/amazon/adgroup-api.service';
// import { IAmazonAuth } from 'src/interfaces/index.type';
import { ClsService } from 'nestjs-cls';
import { ReportApiService } from 'src/services/amazon/report-api.service';

const defaultOptions = {
  delay: 1000 * 60,
  attempts: 20,
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
    private campaignApi: CampaignApiService,
    private adGroupApi: AdGroupApiService,
    private reportApi: ReportApiService,
    private readonly cls: ClsService

  ) { }

  async generateReport() {
    const scopeId = this.cls.get('scopeId');
    const accessToken = this.cls.get('accessToken');
    const yesterday = new Date(Date.now() - 1 * 86400000).toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    this.logger.log('Generating report ' + yesterday + ' to ' + today);
    const payload = {
      scopeId,
      startDate: yesterday,
      endDate: yesterday,
    }

    const auth = {
      scopeId,
      accessToken,
    }


    const reportPromises = await Promise.allSettled([
      'generateCampaign','generateAdGroup','generateAd',
      'generateKeyword','generateSearchTerm','generateTargeting'
    ].map(fn=>this.reportApi[fn](auth, payload)))

    const jobs: Job[] = [];
    for (const report of reportPromises) {
      if (report.status == 'fulfilled') {
        this.logger.log(`Requested for report generation: ${report.value.reportId} ${report.value.configuration.reportTypeId}`);
        const job = await this.reportQueue.add('report', { ...report.value, auth }, defaultOptions);
        jobs.push(job);
        continue;
      }
      const data = report.reason.response.data
      if (data.code == PENDING_REPORT_CODE) {
        const reportId = data.detail?.split(': ')[1]
        this.logger.log('previous report is already pending passing forward');
        const job = await this.reportQueue.add('report',
          { reportId, auth },
          defaultOptions);
        jobs.push(job);
        continue;
      }
      this.logger.error('Error generating report', report.reason.response.data);
      return jobs;
    }
  }
}