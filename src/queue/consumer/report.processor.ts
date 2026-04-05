import {  OnWorkerEvent, Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { AmazonApiService, ReportResponse } from "src/services/amazon/amazon-api.service";
import { AxiosError } from "axios";
import { ReportService } from "src/services/report.service";
import { ReportProducer } from "../producer/report.producer";
import { Logger } from "@nestjs/common";
import * as fs from 'fs';
import * as path from 'path';
import * as zlib from 'zlib';

@Processor('reportProcessor')
export class ReportProcessor extends WorkerHost {
    private readonly logger = new Logger(ReportProducer.name);

    constructor(
        private amazonApi: AmazonApiService,
        // private bidProducer: BidProducer,
        private readonly reportService: ReportService
    ) { super(); }

    async getReportMatrics(reportFile: string) {
        console.log('Getting report metrics for file:', reportFile);
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
        }
    }
    

    async downloadReport(res: ReportResponse, attempt: number = 1) {
        if (attempt > 3) throw new Error('Max download attempts reached');
        try {
            this.logger.log(`Downloading report from: ${res.url}`);
            const response = await fetch(res.url!);
            if (!response.ok) {
                throw new Error(`Failed to download report: ${response.statusText}`);
            }
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const fileName = `${res.name}.json.gz`
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
            return this.downloadReport(res, ++attempt);
        }
    }


    async process(job: Job): Promise<any> {
        const reportResponse = await this.amazonApi.getReports(job.data.auth, job.data.reportId)
        if (reportResponse.status !== 'COMPLETED')
            return Promise.reject({ status: reportResponse.status, type: reportResponse.configuration.groupBy[0] });
        const fileName = await this.downloadReport(reportResponse);
        const report = await this.getReportMatrics(fileName);
        console.log('Report metrics extracted:', report.length);
        await this.reportService.saveReport(report, reportResponse);
    }

    @OnWorkerEvent('active')
    onActive(job: Job) {
        console.log(
            `Processing job ${job.id}  with reportId ${job.data.reportId}...`,
        );
    }

    @OnWorkerEvent('error')
    onError(error: any) {
        if (error instanceof AxiosError) return console.error('Worker error:', error.response?.data);
        console.error('Worker error:', error);
    }
    @OnWorkerEvent('completed')
    onComplete(job: Job, result: any) {
        console.log(`completed job ${job.id} of type ${job.data.name} with reportId ${job.data.reportId}`);
        // if (job.name == 'generateReport') return this.reportProducer.extractReport(result)
        // this.bidProducer.scheduleBidAdjustment()
    }
    @OnWorkerEvent('failed')
    onFailed(job: Job, error) {
        console.log(job.data.name,error, 'Job failed with error');
    }
}


