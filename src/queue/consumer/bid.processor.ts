import { OnWorkerEvent, Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import Engine from "src/engine/core/rule.engine";
import { CampaignService } from "src/services/campaign.service";

@Processor('bidProcessor')
export class BidProcessor extends WorkerHost {
    constructor(
        private readonly engine: Engine,
        private readonly campaignService: CampaignService,
    ) { super() }

    async process(job: Job): Promise<any> {
        const bundle = await this.campaignService.findCampaignBundle(job.data.campaignId)
        await this.engine.run(bundle)
    }

    @OnWorkerEvent('active')
    onActive(job: Job) {
        // console.log(
        //     `Processing job ${job.id} of type ${job.name} with data ${job.data}...`,
        // );
    }

    @OnWorkerEvent('error')
    onError(error: any) {
        console.error('Worker error:', error);
    }
    
    @OnWorkerEvent('completed')
    onComplete(job: Job) {
        // console.log(
        //     `completed job ${job.id} of type ${job.name} with data ${job.data}...`,
        // );
    }
    @OnWorkerEvent('failed')
    onFailed(job: Job, error) {
        console.log(error, 'Job failed with error');
    }
}


