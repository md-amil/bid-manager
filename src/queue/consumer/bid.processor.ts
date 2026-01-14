import { OnWorkerEvent, Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { AmazonSyncService } from "../../services/amazon/amazon-sync.service";
import { ReportService } from "src/services/report.service";

@Processor('bidProcessor')
export class BidProcessor  extends WorkerHost {
    constructor(private readonly reportService: ReportService) {
        super();
    }

    async process(job: Job, token?: string): Promise<any> {
        return this.reportService.createReport(job.data)
    }

    @OnWorkerEvent('active')
    onActive(job: Job) {
        console.log(
        `Processing job ${job.id} of type ${job.name} with data ${job.data}...`,
        );
    }

    @OnWorkerEvent('error')
    onError(error: any) {
        console.error('Worker error:', error);
    }
    @OnWorkerEvent('completed')
    onComplete(job: Job) {
        console.log(
        `completed job ${job.id} of type ${job.name} with data ${job.data}...`,
        );
    }
    @OnWorkerEvent('failed')
    onFailed(job: Job,error) {
        console.log(error,'Job failed with error');
    }
}


