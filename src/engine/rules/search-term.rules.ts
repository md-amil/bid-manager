// import { SearchTermDocument, SearchTermReport } from "src/schemas/reports/search-term-report.schema";
// import { AutoCampaignAdjustment, AutoTargetingType, ICampaignBundle, ICampaignRuleDecision } from "../interfaces";
// import { config } from "../core/rule.engine";
// import { noop } from "rxjs";

// export class CloseMatchOptimizationRule implements ICampaignRuleDecision {
//   shouldApply(campaign: ICampaignBundle): boolean {
//     const closeMatchTerms = this.getSearchTerm(campaign.searchTerm)
//     return closeMatchTerms.length > 0;
//   }

//   getSearchTerm(searchTerm:SearchTermDocument[]){
//     return searchTerm.filter(term=>term.matchType==AutoTargetingType.CLOSE_MATCH)
//   } 

//   execute(campaign: ICampaignBundle): AutoCampaignAdjustment {
//     const closeMatchTerms = this.getSearchTerm(campaign.searchTerm);
//     const convertingTerms = closeMatchTerms.filter(st => st.sales7d > 0 && st.acos <= config.targetAcos);
//     const poorPerformers = closeMatchTerms.filter(st => st.spend >= 300 && st.sales7d === 0);

//     let action: 'INCREASE' | 'DECREASE' | 'CONTROL' = 'CONTROL';
//     let change = 0;

//     if (convertingTerms.length > 0 && poorPerformers.length === 0) {
//       action = 'INCREASE';
//       change = 20;
//     } else if (poorPerformers.length > 0) {
//       action = 'DECREASE';
//       change = -50;
//     }

//     return {
//       ruleId: 'RULE_006',
//       ruleName: 'Close Match Targeting Optimization',
//       campaignId: campaign.id,
//       adjustments: {
//         bidChanges: [{ targetingType: AutoTargetingType.CLOSE_MATCH, change }],
//         action,
//       },
//       reasoning:
//         `Close Match targeting analysis: ${convertingTerms.length} converting terms, ` +
//         `${poorPerformers.length} poor performers. ${action === 'INCREASE' ? 'Increasing' : 'Decreasing'} bids by ${Math.abs(change)}%.`,
//     };
//   }
// }

// export class LooseMatchOptimizationRule implements ICampaignRuleDecision {
//   shouldApply(campaign: ICampaignBundle): boolean {
//     const looseMatchTerms = this.getSearchTerm(campaign.searchTerm);
//     return looseMatchTerms.length > 0;
//   }

//   getSearchTerm(searchTerm:SearchTermDocument[]){
//     return searchTerm.filter(term=>term.matchType==AutoTargetingType.LOOSE_MATCH)
//   } 

//   execute(campaign: ICampaignBundle): AutoCampaignAdjustment {
//     const looseMatchTerms =this.getSearchTerm(campaign.searchTerm);
//     const goodCTRLowCPC = looseMatchTerms.filter(st => st.getCTR() > 1 && st.getCPC() < 2);
//     const genericTraffic = looseMatchTerms.filter(st => st.acos > campaign.getACOSTarget() * 2);

//     let action: 'INCREASE' | 'DECREASE' | 'CONTROL' = 'CONTROL';
//     let change = 0;

//     if (goodCTRLowCPC.length > 0) {
//       action = 'INCREASE';
//       change = 20;
//     } else if (genericTraffic.length > looseMatchTerms.length * 0.5) {
//       action = 'DECREASE';
//       change = -50;
//     }

//     return {
//       ruleId: 'RULE_007',
//       ruleName: 'Loose Match Targeting Optimization',
//       campaignId: campaign.getId(),
//       adjustments: {
//         bidChanges: [{ targetingType: AutoTargetingType.LOOSE_MATCH, change }],
//         action,
//       },
//       reasoning:
//         `Loose Match targeting analysis: ${goodCTRLowCPC.length} terms with good CTR/low CPC. ` +
//         `${action === 'INCREASE' ? 'Increasing' : 'Decreasing'} bids by ${Math.abs(change)}%.`,
//     };
//   }
// }

// export class SubstituteTargetingOptimizationRule implements ICampaignRuleDecision {
//   shouldApply(campaign: ICampaignBundle): boolean {
//     const substituteTerms = campaign.getSearchTermsByType(AutoTargetingType.SUBSTITUTES);
//     return substituteTerms.length > 0;
//   }

//   execute(campaign: ICampaignBundle): AutoCampaignAdjustment {
//     const substituteTerms = campaign.getSearchTermsByType(AutoTargetingType.SUBSTITUTES);
//     const competitiveWins = substituteTerms.filter(
//       st => st.sales > 0 && st.acos <= config.targetAcos
//     );
//     const poorCompetitiveMatch = substituteTerms.filter(
//       st => st.clicks > 10 && st.sales === 0
//     );

//     let action: 'INCREASE' | 'DECREASE' | 'CONTROL' = 'CONTROL';
//     let change = 0;

//     if (competitiveWins.length > 0) {
//       action = 'INCREASE';
//       change = 25;
//     } else if (poorCompetitiveMatch.length > 0) {
//       action = 'DECREASE';
//       change = -50;
//     }

//     return {
//       ruleId: 'RULE_008',
//       ruleName: 'Substitute Targeting Optimization',
//       campaignId: campaign.id,
//       adjustments: {
//         bidChanges: [{ targetingType: AutoTargetingType.SUBSTITUTES, change }],
//         action,
//       },
//       reasoning:
//         `Substitute targeting analysis: ${competitiveWins.length} competitive wins detected. ` +
//         `${action === 'INCREASE' ? 'Increasing' : 'Decreasing'} bids by ${Math.abs(change)}%.`,
//     };
//   }
// }

// export class ComplementaryTargetingOptimizationRule implements ICampaignRuleDecision {
//   shouldApply(campaign: ICampaignBundle): boolean {
//     const complementaryTerms = campaign.getSearchTermsByType(AutoTargetingType.COMPLEMENTS);
//     return complementaryTerms.length > 0;
//   }

//   execute(campaign: ICampaignBundle): AutoCampaignAdjustment {
//     const complementaryTerms = campaign.getSearchTermsByType(AutoTargetingType.COMPLEMENTS);
//     const genuineComplements = complementaryTerms.filter(
//       st => st.sales > 0 && st.acos <= config.targetAcos
//     );
//     const lowRelevance = complementaryTerms.filter(st => st.sales === 0 && st.acos > 1);

//     let action: 'INCREASE' | 'DECREASE' | 'CONTROL' = 'CONTROL';
//     let change = 0;

//     if (genuineComplements.length > 0) {
//       action = 'INCREASE';
//       change = 25;
//     } else if (lowRelevance.length > complementaryTerms.length * 0.5) {
//       action = 'DECREASE';
//       change = -50;
//     }

//     return {
//       ruleId: 'RULE_009',
//       ruleName: 'Complementary Targeting Optimization',
//       campaignId: campaign.id,
//       adjustments: {
//         bidChanges: [{ targetingType: AutoTargetingType.COMPLEMENTS, change }],
//         action,
//       },
//       reasoning:
//         `Complementary targeting analysis: ${genuineComplements.length} genuine complements found. ` +
//         `${action === 'INCREASE' ? 'Increasing' : 'Decreasing'} bids by ${Math.abs(change)}%.`,
//     };
//  }
// }