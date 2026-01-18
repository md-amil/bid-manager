import { OnWorkerEvent, Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
// import { ReportService } from "src/services/report.service";
import { BidService } from "src/services/amazon/bid.service";
import { Engine } from "src/engine/core/rule.engine";

@Processor('bidProcessor')
export class BidProcessor  extends WorkerHost {
    
    constructor(
        private readonly engine:Engine,
        private readonly bidService: BidService ) {
        super();
    }

    async process(job: Job, token?: string): Promise<any> {
      return this.engine.run(job.data)
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


