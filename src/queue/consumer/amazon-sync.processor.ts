// import { AmazonSyncService } from "./amazon-sync.service";

import { OnWorkerEvent, Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { AmazonSyncService } from "../../services/amazon/amazon-sync.service";

@Processor('campaignSync')
export class AmazonSyncProcessor extends WorkerHost {
    constructor(private readonly syncService: AmazonSyncService) {
        super();
    }

    async process(job: Job, token?: string): Promise<any> {
        const res = await this.syncService.syncAll(job.data.scopeId);
        return res
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
    onFailed(job: Job, error) {
        console.log(error, 'Job failed with error');
    }
}


