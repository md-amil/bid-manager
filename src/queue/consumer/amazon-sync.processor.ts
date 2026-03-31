import { OnWorkerEvent, Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { AmazonSyncService } from "../../services/amazon/amazon-sync.service";

@Processor('campaignSync')
export class AmazonSyncProcessor extends WorkerHost {
    constructor(private readonly syncService: AmazonSyncService) {
        super();
    }

    async process(job: Job): Promise<any> {
        const auth = job.data.auth
        await this.syncService.syncCampains(auth)
        await this.syncService.syncAdGroups(auth)
        await this.syncService.syncAds(auth)
        await this.syncService.syncKeywards(auth)
        await this.syncService.syncNegativeKeywards(auth)
        await this.syncService.syncTargets(auth)
        await this.syncService.syncNegativeTargets(auth)
        await this.syncService.syncProducts(auth)
        // await this.syncService.syncProfile(job.data.organisationId)
    }

    @OnWorkerEvent('active')
    onActive(job: Job) {
        console.log(
            `Processing job ${job.id} of type  with data ${job.data}...`,
        );
    }

    @OnWorkerEvent('error')
    onError(error: any) {
        console.error('Worker error:', error);
    }

    @OnWorkerEvent('completed')
    onComplete(job: Job) {
        console.log(
            `completed job ${job.id} of type ${job.name} with data ${job.data.auth.profileId}...`,
        );
    }

    @OnWorkerEvent('failed')
    onFailed(job: Job, error) {
        console.log(error.response?.data, 'Job failed with error');
    }
}


