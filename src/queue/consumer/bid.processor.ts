import { OnWorkerEvent, Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
// import { ReportService } from "src/services/report.service";
import { BidService } from "src/services/amazon/bid.service";
import   Engine  from "src/engine/core/rule.engine";
import { CampaignService } from "src/services/campaign.service";
// import AdManager from "src/engine/manager";

@Processor('bidProcessor')
export class BidProcessor extends WorkerHost {

    constructor(
        private readonly engine: Engine,
        private readonly bidService: BidService,
        private readonly campaignService: CampaignService
    ) {
        super();
    }

    async process(job: Job, token?: string): Promise<any> {
        console.log(job.data, "job data")
        const bundle = await this.campaignService.findCampaignBundle(job.data.campaignId)
        const searchTerm = await this.campaignService.getSearchTermReport(job.data.campaignId)
        const engine = new Engine({...bundle, searchTerm})
        await engine.run({...bundle, searchTerm})
        // const recommendations = engine.getAdjustments()
        // const manager = new AdManager({bundle,searchTerm,budgetUsages:job.data.budgetUsages})
        // const recommendations = manager.analyzeCampaign()
        // console.log({recommendations})
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


