import { InjectQueue, OnWorkerEvent, Processor, WorkerHost } from "@nestjs/bullmq";
import { Job, Queue } from "bullmq";
import { AmazonApiService } from "src/services/amazon/amazon-api.service";
import { AxiosError } from "axios";
import { ReportService } from "src/services/report.service";
import { BidProducer } from "../producer/bid.producer";
import { ReportProducer } from "../producer/report.producer";

@Processor('reportProcessor')
export class ReportProcessor extends WorkerHost {
    constructor(
        private amazonApi: AmazonApiService,
        private bidProducer: BidProducer,
        private reportProducer:ReportProducer,
        private readonly reportService: ReportService
    ) {   super();  }

    async process(job: Job, token?: string): Promise<any> {
        if (job.name == 'extract') return this.reportService.createReport(job.data)
        const report = await this.amazonApi.getReports(job.data.reportId);
        if (report.status === 'COMPLETED') return Promise.resolve(report)
        return Promise.reject(report.status);
    }

    @OnWorkerEvent('active')
    onActive(job: Job) {
        console.log(
            `Processing job ${job.id} of type ${job.name} with reportId ${job.data.reportId}...`,
        );
    }

    @OnWorkerEvent('error')
    onError(error: any) {
        if (error instanceof AxiosError) return console.error('Worker error:', error.response?.data);
        console.error('Worker error:', error);
    }
    @OnWorkerEvent('completed')
    onComplete(job: Job, result: any) {
        console.log( `completed job ${job.id} of type ${job.name}`);
        if(job.name=='generateReport') return this.reportProducer.extractReport(result)
        this.bidProducer.scheduleBidAdjustment(result)
    }
    @OnWorkerEvent('failed')
    onFailed(job: Job, error) {
        console.log(error, 'Job failed with error');
    }
}


