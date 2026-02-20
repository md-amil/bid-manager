import { Logger } from '@nestjs/common';
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

import { CampaignService } from 'src/services/campaign.service';
import { OptimizationService } from 'src/modules/optimization/optimization.service';

@Processor('bidProcessor')
export class BidProcessor extends WorkerHost {
  private readonly logger = new Logger(BidProcessor.name);

  constructor(
    private readonly campaignService: CampaignService,
    private readonly optimizationService: OptimizationService,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    const { campaignId, budgetUsages = [] } = job.data as {
      campaignId: string;
      budgetUsages: { campaignId: string; budgetUtilizationPercent?: number }[];
    };

    const bundle = await this.campaignService.findCampaignBundle(campaignId);
    if (!bundle) {
      this.logger.warn(`Bundle not found for campaign ${campaignId}`);
      return;
    }

    const searchTerms =
      await this.campaignService.getSearchTermReport(campaignId);

    await this.optimizationService.optimizeCampaign({
      bundle,
      searchTerms,
      scopeId: String(bundle.scopeId),
      budgetUsages,
    });
  }

  @OnWorkerEvent('active')
  onActive(job: Job): void {
    this.logger.log(
      `[bidProcessor] Processing job ${job.id} → campaign ${(job.data as { campaignId: string }).campaignId}`,
    );
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job): void {
    this.logger.log(`[bidProcessor] Completed job ${job.id}`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error): void {
    this.logger.error(
      `[bidProcessor] Failed job ${job.id}: ${error.message}`,
      error.stack,
    );
  }

  @OnWorkerEvent('error')
  onError(error: Error): void {
    this.logger.error('[bidProcessor] Worker error', error.stack);
  }
}
