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
        const scopeId = job.data.scopeId;
        await this.syncService.syncCampains(scopeId)
        await this.syncService.syncAdGroups(scopeId)
        await this.syncService.syncAds(scopeId)
        await this.syncService.syncKeywards(scopeId)
        await this.syncService.syncNegativeKeywards(scopeId)
        await this.syncService.syncTargets(scopeId)
        await this.syncService.syncNegativeTargets(scopeId)
        await this.syncService.syncProfile('')
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


