import { TargetingType } from "src/schemas/campaign.schema"
import { AutoCampain, IInput, } from "./utility"
import { AdjustmentAction, Recommendation } from "./interfaces"





export default class AdManager extends AutoCampain {
    private recommendations: Recommendation[] = []
    constructor(data: IInput) {
        super(data)
    }

    analyzeCampaign() {
        if (this.bundle.state == 'PAUSED') return console.log("campaign is paused skipping...")
        if (this.bundle.targetingType === TargetingType.AUTO) this.runAuto();
        else this.runManual();
        this.recommendations.sort((a, b) => a.priority - b.priority);
        return this.recommendations;
    }

    runAuto() {
        const campaign = this.bundle
        if (this._isProfitableSale()) {
            this.recommendations.push(
                new Recommendation({
                    keywordOrCampaign: campaign.campaignId,
                    action: AdjustmentAction.INCREASE_BUDGET,
                    currentValue: campaign.budget.budget,
                    recommendedValue: campaign.budget.budget * 1.25,
                    percentageChange: 25,
                    reason: 'Auto campaign producing consistent profitable sales with acceptable ACOS',
                    priority: 1
                })
            );
        }

        if (this._isLaunch()) {
            this.recommendations.push(
                new Recommendation({
                    keywordOrCampaign: campaign.campaignId,
                    action: AdjustmentAction.INCREASE_BID,
                    currentValue: campaign.budget.budget,
                    recommendedValue: campaign.budget.budget * 1.1,
                    percentageChange: 10,
                    reason: 'New product launch phase - use suggested bids for discovery',
                    priority: 3
                })
            );
        }

        if (this._goodCVRLowImp()) {
            this.recommendations.push(
                new Recommendation({
                    keywordOrCampaign: campaign.campaignId,
                    action: AdjustmentAction.INCREASE_BID,
                    currentValue: campaign.budget.budget,
                    recommendedValue: campaign.budget.budget,
                    percentageChange: 10,
                    reason: 'Good Conversion Rate and Limited Impressions Increasing bids by 25% to unlock more inventory',
                    priority: 3
                })
            );
        }
        if (this._isHighSpendPoorConversion()) {
            this.recommendations.push(
                new Recommendation({
                    keywordOrCampaign: campaign.campaignId,
                    action: AdjustmentAction.DECREASE_BID,
                    currentValue: campaign.budget.budget,
                    recommendedValue: campaign.budget.budget,
                    percentageChange: 25,
                    reason: 'Lowering bids and budget by 25% and review search terms immediately.',
                    priority: 5
                })
            );
            this.recommendations.push(
                new Recommendation({
                    keywordOrCampaign: campaign.campaignId,
                    action: AdjustmentAction.DECREASE_BUDGET,
                    currentValue: campaign.budget.budget,
                    recommendedValue: campaign.budget.budget,
                    percentageChange: 25,
                    reason: 'Lowering  budget and budget by 25% and review search terms immediately.',
                    priority: 6
                })
            )
        }

        if (this.hasListingConversionIssue()) {
            new Recommendation({
                keywordOrCampaign: campaign.campaignId,
                action: AdjustmentAction.DECREASE_BID,
                currentValue: campaign.budget.budget,
                recommendedValue: campaign.budget.budget,
                percentageChange: 50,
                reason: 'Reducing bids by 50% until listing improvements are made.',
                priority: 6
            })
        }
    }


    runManual() {
        console.log("campaign in manual un implemented for now")
    }

}