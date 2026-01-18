import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { AmazonApiService } from 'src/services/amazon/amazon-api.service';
import * as fs from 'fs';
import * as path from 'path';
import * as zlib from 'zlib';
import { CampaignApiService } from 'src/services/amazon/campaign-api.service';

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
    private campaignApi: CampaignApiService
  ) { }

  async generateReport(scopeId:string) {
    this.logger.log('Generating report');
    try {
      const response = await this.campaignApi.generateReport({
        scopeId: scopeId,
        name: "Sponser Report",
        startDate: "2026-01-14",
        endDate: "2026-01-14",
      });
      this.logger.log('Requested for report generation');
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
  
  async getReportMatrics(reportFile: string) {
    try {
      const reportsDir = path.join(process.cwd(), 'reports');
      if (!fs.existsSync(reportsDir)) {
        this.logger.warn('Reports directory not found');
        return []
      }
      const reportPath = path.join(reportsDir, reportFile);
      this.logger.log(`Reading report file: ${reportFile}`);
      const compressedData = fs.readFileSync(reportPath);
      const decompressedData = zlib.gunzipSync(compressedData);
      const reportData = JSON.parse(decompressedData.toString());
      this.logger.log('Successfully extracted and parsed gzipped report');
      return reportData;
    } catch (error) {
      this.logger.error('Error reading report data', error);
      return []
      // return this.getBasicReportData(campaign);
    }
  }

  async downloadReport(url: string) {
    try {
      this.logger.log(`Downloading report from: ${url}`);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to download report: ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const timestamp = Date.now();
      const fileName = `report-${timestamp}.json.gz`;
      const reportsDir = path.join(process.cwd(), 'reports');
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
        this.logger.log('Created reports directory');
      }
      const filePath = path.join(reportsDir, fileName);
      fs.writeFileSync(filePath, buffer);
      this.logger.log(`Report saved successfully: ${fileName}`);
      return fileName;
    } catch (error) {
      this.logger.error('Error downloading report', error);
      throw error;
    }
  }


  async extractReport(data: any) {
    try {
      const fileName = await this.downloadReport(data.url);
      console.log({fileName})
      const report = await this.getReportMatrics(fileName);
      console.log(report.length,"report Length")
      if(report.length <= 0) return;
      const job = await this.reportQueue.add('extract', report);
      return job;
    } catch (error) {
      this.logger.error('Error generating report', error);
    }
  }
}