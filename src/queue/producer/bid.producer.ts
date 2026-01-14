import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import * as fs from 'fs';
import * as path from 'path';
import * as zlib from 'zlib';

@Injectable()
export class BidProducer {
  private readonly logger = new Logger(BidProducer.name);
  constructor(
    @InjectQueue('bidProcessor') private bidQueue: Queue,
  ) { }

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
      
      // Download the file
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to download report: ${response.statusText}`);
      }

      // Get the file data as buffer
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Generate filename with timestamp
      const timestamp = Date.now();
      const fileName = `report-${timestamp}.json.gz`;

      // Ensure reports directory exists
      const reportsDir = path.join(process.cwd(), 'reports');
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
        this.logger.log('Created reports directory');
      }

      // Save the file
      const filePath = path.join(reportsDir, fileName);
      fs.writeFileSync(filePath, buffer);
      
      this.logger.log(`Report saved successfully: ${fileName}`);
      return fileName;
    } catch (error) {
      this.logger.error('Error downloading report', error);
      throw error;
    }
  }


  async scheduleBidAdjust(data: any) {
    try {
      const fileName = await this.downloadReport(data.url);
      console.log({fileName})
      const report = await this.getReportMatrics(fileName);
      console.log(report.length,"report Length")
      if(report.length <= 0) return;
      const job = await this.bidQueue.add('adjustBid', report[0]);
      return job;
    } catch (error) {
      this.logger.error('Error generating report', error);
    }
  }
}