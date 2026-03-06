import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { CampaignApiService } from 'src/services/amazon/campaign-api.service';
import { AdGroupApiService } from 'src/services/amazon/adgroup-api.service';
import { IAmazonAuth } from 'src/interfaces/index.type';
import { ClsService } from 'nestjs-cls';

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
      name: "Sponser Report",
      startDate: yesterday,
      endDate: yesterday,
    }
    const auth = {
      scopeId,
      accessToken,
    }

    const campaign = this.campaignApi.generateCampaignReport(auth, payload)
    const keyword = this.adGroupApi.generateKeywordReport(auth, payload)
    const searchTerm = this.adGroupApi.generateSearchTerm(auth, payload)
    const targeting = this.campaignApi.generateTargetingReport(auth,payload)


    const jobs: Job[] = [];
    for (const report of await Promise.allSettled([campaign, keyword, searchTerm,targeting])) {
      if (report.status == 'fulfilled') {
        this.logger.log(`Requested for report generation: ${report.value.reportId}`);
        const job = await this.reportQueue.add('report', { ...report.value,auth}, defaultOptions);
        jobs.push(job);
        continue;
      }
      // console.log("unknown report status", report.reason.response);
      const data = report.reason.response.data
      if (data.code == PENDING_REPORT_CODE) {
        const reportId = data.detail?.split(': ')[1]
        this.logger.log('previous report is already pending passing forward',);
        const job = await this.reportQueue.add('report',
          { reportId,auth },
          defaultOptions);
        jobs.push(job);
        continue;
      }
      this.logger.error('Error generating report', report.reason.response.data);
      return jobs;
    }



    // for await (const report of [campaign, keyword]) {
    //   console.log(report);
    // }

    // // const [camReport,adReport] = await 
    // for await (report of Promise.all([campaign,keyword])){

    // }
    // this.logger.log('Requested for report generation');
    // const job = await this.reportQueue.add('generateReport',
    //   { reportId: camReport.reportId }, defaultOptions);
    // return job;

    // try {
    //   const camReport = await this.campaignApi.generateCampaignReport({
    //     scopeId: scopeId,
    //     name: "Sponser Report",
    //     startDate:yesterday,
    //     endDate: yesterday,
    //   });
    //   const adReport = await this.adGroupApi.generateKeywordReport({
    //     scopeId: scopeId,
    //     name: "Sponser Report",
    //     startDate:yesterday,
    //     endDate: yesterday,
    //   });
    //   this.logger.log('Requested for report generation');
    //   const job = await this.reportQueue.add('generateReport',
    //     { reportId: camReport.reportId }, defaultOptions);
    //   // return job;

    //     this.campaignApi.generateCampaignReport({
    //     scopeId: scopeId,
    //     name: "Sponser Report",
    //     startDate:yesterday,
    //     endDate: yesterday,
    //   }),
    //   this.adGroupApi.generateKeywordReport({
    //     scopeId: scopeId,
    //     name: "Sponser Report",
    //     startDate:yesterday,
    //     endDate: yesterday,
    //   }),
    //   this.reportQueue.add('generateReport',
    //     { reportId: camReport.reportId }, defaultOptions)

    // } catch (error) {
    //   if (error.response.data.code == PENDING_REPORT_CODE) {
    //     const reportId = error.response.data.detail?.split(': ')[1]
    //     this.logger.log('previous report is already pending passing forward',);
    //     const job = await this.reportQueue.add('generateReport',
    //       { reportId },
    //       defaultOptions);
    //     return job;
    //   }
    //   this.logger.error('Error generating report', error.response.data);
    // }
  }
}