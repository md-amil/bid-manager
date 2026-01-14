import { InjectQueue, OnWorkerEvent, Processor, WorkerHost } from "@nestjs/bullmq";
import { Job, Queue } from "bullmq";
import { AmazonSyncService } from "../../services/amazon/amazon-sync.service";
import { AmazonApiService } from "src/services/amazon/amazon-api.service";
import { CampaignService } from "src/services/campaign.service";
import { BidProducer } from "../producer/bid.producer";
import { AxiosError } from "axios";

@Processor('reportProcessor')
export class ReportProcessor extends WorkerHost {
    constructor(private amazonApi: AmazonApiService,private bidProducer: BidProducer,) {
        super();
    }

    async process(job: Job, token?: string): Promise<any> {
        const report  =  await this.amazonApi.getReports(job.data.reportId);
        if(report.status === 'COMPLETED') return Promise.resolve(report)
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
        if(error instanceof AxiosError) return  console.error('Worker error:', error.response?.data);
        console.error('Worker error:', error);
    }
    @OnWorkerEvent('completed')
    onComplete(job: Job, result: any) {
        console.log(
            `completed job ${job.id} of type ${job.name} with ${result.status}...`,
        );
        this.bidProducer.scheduleBidAdjust(result).then((job: Job)=>console.log("job added to bid",job.id)).catch(console.error);
    }
    @OnWorkerEvent('failed')
    onFailed(job: Job, error) {
        console.log(error, 'Job failed with error');
    }
}


