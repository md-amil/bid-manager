// import { Campaign } from "src/schemas/campaign.schema"
// import { ICampaignBundle,  } from "./interfaces"
// import { SearchTermDocument } from "src/schemas/reports/search-term-report.schema"
// import { config } from "dotenv"

// // export enum AdjustmentAction {
// //     INCREASE_BID = 'INCREASE_BID',
// //     DECREASE_BID = 'DECREASE_BID',
// //     PAUSE = 'PAUSE',
// //     ENABLE = 'ENABLE'
// // }





// export interface IInput {
//     bundle: ICampaignBundle
//     budgetUsages: any
//     searchTerm: SearchTermDocument[]
// }

// export class AutoCampaign {
//     protected bundle: ICampaignBundle
//     protected budgetUsage: any
//     protected searchTerm: SearchTermDocument[]

//     constructor(input: IInput) {
//         this.bundle = input.bundle
//         this.budgetUsage = input.budgetUsages
//         this.searchTerm = input.searchTerm
//     }

//     // get campaignAcos() {
//     //     const { spend, sales7d } = this.bundle.campaignReport
//     //     return spend && sales7d ? spend / sales7d : null
//     // }

//     // get matrics() {
//     //     return this.bundle.campaignReport
//     // }

//     // _isProfitableSale() {
//     //     return this.campaignAcos && this.campaignAcos < config.targetAcos
//     // }

//     // _getMinSpendThreshold() {
//     //     // done
//     //     const { spend, clicks, sales7d } = this.bundle.campaignReport;
//     //     const avgCpc = clicks > 0 ? spend / clicks : 0;
//     //     const cvr = clicks > 0 ? sales7d / clicks : 0;
//     //     const expectedClicksBeforeJudgement =
//     //         cvr > 0
//     //             ? Math.ceil((1 / cvr) * 1.5)
//     //             : config.fallbackClicks;
//     //     return avgCpc * expectedClicksBeforeJudgement;
//     // }

//     // _isHighSpendPoorConversion() {
//     //     // done
//     //     const { clicks, sales7d, spend } = this.bundle.campaignReport;
//     //     if (clicks < config.minClicks) return false;
//     //     if (spend < this._getMinSpendThreshold()) return false;
//     //     if (sales7d === 0) return true;
//     //     const acos = spend / sales7d;
//     //     return acos > config.targetAcos;
//     // }

//     // _profitableKeyword() {
//     //     const profitableKeywords = this.searchTerm.filter((term) => {
//     //         const acos = term.spend && term.sales7d ? term.spend / term.sales7d : 0;
//     //         term.sales7d >= 2 && (acos > 0 && acos <= config.targetAcos)
//     //     });
//     //     return profitableKeywords;
//     // }

//     // _isLaunch() {
//     //     return this.searchTerm.length <= 2
//     //         && this.bundle.campaignReport.clicks <= config.minClicks
//     //         && this.bundle.campaignReport.sales7d == 0
//     // }

//     // _goodCVRLowImp() {
//     //     const { campaignReport, budget } = this.bundle
//     //     const { impressions, clicks, sales7d, } = campaignReport
//     //     if (clicks == 0) return false
//     //     const convRate = sales7d / clicks
//     //     const budgetUtilized = budget.budget[0] > 0 ? campaignReport.spend / budget.budget[0] : 0;
//     //     return convRate > 0.05 && impressions < 500 && budgetUtilized < 0.7;
//     // }

//     // _addNegative(keyword: keywordWithReport) {
//     //     return (
//     //         (keyword.keywordReports.clicks >= config.minClicks ||
//     //             keyword.keywordReports.cost >= config.minSpend) &&
//     //         keyword.keywordReports.sales7d === 0
//     //     );
//     // }

//     _optTargeting() {

//     }

//     // _moveToManual(keyword) {
//     //     return (
//     //         keyword.autoTargeted &&
//     //         keyword.metrics.sales >= 2 &&
//     //         (keyword.metrics.acos === null || keyword.metrics.acos <= config.targetAcos) &&
//     //         keyword.metrics.clicks >= 5
//     //     )
//     // }

//     // hasListingConversionIssue() {
//     //     const impressionsOk =
//     //         this.matrics.impressions >= config.minImpressions;
//     //     const clicksOk =
//     //         this.matrics.clicks >= config.minClicks;
//     //     const lowSales =
//     //         this.matrics.purchases7d === 0 ||
//     //         this.matrics.purchases7d/this.matrics.clicks < config.minCvr;

//     //     // const listingQualityPoor =
//     //     //     metrics.rating < thresholds.minRating ||
//     //     //     metrics.priceIndex > thresholds.maxPriceIndex ||
//     //     //     metrics.contentScore < thresholds.minContentScore;

//     //     return impressionsOk && clicksOk && lowSales;
//     // }
// }