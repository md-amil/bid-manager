import { ICampaignBundle, keywordWithReport } from './interfaces';
import { SearchTermDocument } from 'src/schemas/reports/search-term-report.schema';
import { CampaignReport } from 'src/schemas/reports/report.schema';

// export enum AdjustmentAction {
//     INCREASE_BID = 'INCREASE_BID',
//     DECREASE_BID = 'DECREASE_BID',
//     PAUSE = 'PAUSE',
//     ENABLE = 'ENABLE'
// }
const config = {
  targetAcos: parseFloat(process.env.TARGET_ACOS || '0.30'),
  minClicks: parseInt(process.env.MIN_SAMPLE_CLICKS || '20'),
  minSpend: parseFloat(process.env.MIN_SAMPLE_SPEND || '200'),
  fallbackClicks: 20,
  minImpressions: 1000,
  minCvr: 0.08,
  // minSpendThreshold:parseFloat(process.env.MIN_THRESOLD_SPEND||)
};

interface KeywordWithMetrics {
  autoTargeted: boolean;
  metrics: {
    sales: number;
    acos: number | null;
    clicks: number;
  };
}

export interface IInput {
  bundle: ICampaignBundle;
  budgetUsages: any;
  searchTerm: SearchTermDocument[];
}

export class AutoCampain {
  protected bundle: ICampaignBundle;
  protected budgetUsage: any;
  protected searchTerm: SearchTermDocument[];

  constructor(input: IInput) {
    this.bundle = input.bundle;
    this.budgetUsage = input.budgetUsages;
    this.searchTerm = input.searchTerm;
  }

  get campaignAcos(): number | null {
    const { spend, sales7d } = this.bundle.campaignReport;
    return spend && sales7d ? spend / sales7d : null;
  }

  get matrics(): CampaignReport {
    return this.bundle.campaignReport;
  }

  _isProfitableSale(): number | boolean | null {
    return this.campaignAcos && this.campaignAcos < config.targetAcos;
  }

  _getMinSpendThreshold(): number {
    const { spend, clicks, sales7d } = this.bundle.campaignReport;
    const avgCpc = clicks > 0 ? spend / clicks : 0;
    const cvr = clicks > 0 ? sales7d / clicks : 0;
    const expectedClicksBeforeJudgement =
      cvr > 0 ? Math.ceil((1 / cvr) * 1.5) : config.fallbackClicks;
    return avgCpc * expectedClicksBeforeJudgement;
  }

  _isHighSpendPoorConversion(): boolean {
    const { clicks, sales7d, spend } = this.bundle.campaignReport;
    if (clicks < config.minClicks) return false;
    if (spend < this._getMinSpendThreshold()) return false;
    if (sales7d === 0) return true;
    const acos = spend / sales7d;
    return acos > config.targetAcos;
  }

  _profitableKeyword(): SearchTermDocument[] {
    const profitableKeywords = this.searchTerm.filter((term) => {
      const acos = term.cost && term.sales7d ? term.cost / term.sales7d : 0;
      term.sales7d >= 2 && acos > 0 && acos <= config.targetAcos;
    });
    return profitableKeywords;
  }

  _isLaunch(): boolean {
    return (
      this.searchTerm.length <= 2 &&
      this.bundle.campaignReport.clicks <= config.minClicks &&
      this.bundle.campaignReport.sales7d == 0
    );
  }

  _goodCVRLowImp(): boolean {
    const { campaignReport, budget } = this.bundle;
    const { impressions, clicks, sales7d } = campaignReport;
    if (clicks == 0) return false;
    const convRate = sales7d / clicks;
    const budgetUtilized =
      budget.budget > 0 ? campaignReport.spend / budget.budget : 0;
    return convRate > 0.05 && impressions < 500 && budgetUtilized < 0.7;
  }

  _addNegative(keyword: keywordWithReport): boolean {
    return (
      (keyword.keywordReports.clicks >= config.minClicks ||
        keyword.keywordReports.cost >= config.minSpend) &&
      keyword.keywordReports.sales7d === 0
    );
  }

  _optTargeting(): void {}

  _moveToManual(keyword: KeywordWithMetrics): boolean {
    return (
      keyword.autoTargeted &&
      keyword.metrics.sales >= 2 &&
      (keyword.metrics.acos === null ||
        keyword.metrics.acos <= config.targetAcos) &&
      keyword.metrics.clicks >= 5
    );
  }

  hasListingConversionIssue(): boolean {
    const impressionsOk = this.matrics.impressions >= config.minImpressions;
    const clicksOk = this.matrics.clicks >= config.minClicks;
    const lowSales =
      this.matrics.purchases7d === 0 ||
      this.matrics.purchases7d / this.matrics.clicks < config.minCvr;

    // const listingQualityPoor =
    //     metrics.rating < thresholds.minRating ||
    //     metrics.priceIndex > thresholds.maxPriceIndex ||
    //     metrics.contentScore < thresholds.minContentScore;

    return impressionsOk && clicksOk && lowSales;
  }
}
