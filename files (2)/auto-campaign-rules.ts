// // Auto Campaign Optimization Rules Engine

// import { AutoTargetingType } from 'src/engine/interfaces';
// import { Campaign, Keyword, Metrics } from './domain-entities';

// // Auto Targeting Types


// // Search Term with performance data
// export class SearchTerm {
//   constructor(
//     readonly id: string,
//     readonly term: string,
//     readonly campaignId: string,
//     readonly targetingType: AutoTargetingType,
//     readonly clicks: number,
//     readonly spend: number,
//     readonly sales: number,
//     readonly impressions: number,
//     readonly acos: number, // Advertising Cost of Sales
//     readonly lastUpdated: Date
//   ) {}

//   getConversionRate(): number {
//     return this.clicks > 0 ? (this.sales / this.clicks) * 100 : 0;
//   }

//   getCPC(): number {
//     return this.clicks > 0 ? this.spend / this.clicks : 0;
//   }

//   getCTR(): number {
//     return this.impressions > 0 ? (this.clicks / this.impressions) * 100 : 0;
//   }

//   isHighSpenderWithNoSales(): boolean {
//     return this.spend >= 20 && this.sales === 0;
//   }

//   hasHighClicksWithZeroSales(): boolean {
//     return this.clicks >= 20 && this.sales === 0;
//   }
// }

// // Auto Campaign specific entity
// export class AutoCampaign extends Campaign {
//   private searchTerms: SearchTerm[] = [];
//   private targetingTypes: AutoTargetingType[] = [];
//   private acosTarget: number; // e.g., 0.30 means 30%
//   private negativKeywords: string[] = [];

//   constructor(
//     id: string,
//     name: string,
//     budget: any,
//     metrics: Metrics,
//     acosTarget: number = 0.30
//   ) {
//     super(id, name, budget, metrics);
//     this.acosTarget = acosTarget;
//   }

//   setTargetingTypes(types: AutoTargetingType[]): void {
//     this.targetingTypes = types;
//   }

//   getTargetingTypes(): AutoTargetingType[] {
//     return this.targetingTypes;
//   }

//   addSearchTerms(terms: SearchTerm[]): void {
//     this.searchTerms.push(...terms);
//   }

//   getSearchTerms(): SearchTerm[] {
//     return this.searchTerms;
//   }

//   addNegativeKeyword(keyword: string): void {
//     if (!this.negativKeywords.includes(keyword)) {
//       this.negativKeywords.push(keyword);
//     }
//   }

//   getNegativeKeywords(): string[] {
//     return this.negativKeywords;
//   }

//   getACOSTarget(): number {
//     return this.acosTarget;
//   }

//   isACOSWithinTarget(): boolean {
//     // Calculate weighted ACOS
//     const totalSpend = this.searchTerms.reduce((sum, st) => sum + st.spend, 0);
//     const totalSales = this.searchTerms.reduce((sum, st) => sum + st.sales, 0);

//     if (totalSales === 0) return false;
//     const campaignACOS = totalSpend / totalSales;
//     return campaignACOS <= this.acosTarget;
//   }

//   hasConsistentSales(): boolean {
//     const last7Days = this.searchTerms.filter(
//       st => new Date().getTime() - st.lastUpdated.getTime() < 7 * 24 * 60 * 60 * 1000
//     );
//     return last7Days.length > 0 && last7Days.some(st => st.sales > 0);
//   }

//   getHighPerformingSearchTerms(minSales: number = 100): SearchTerm[] {
//     return this.searchTerms.filter(
//       st => st.sales >= minSales && st.acos <= this.acosTarget
//     );
//   }

//   getLowPerformingSearchTerms(): SearchTerm[] {
//     return this.searchTerms.filter(
//       st => st.clicks >= 20 && st.sales === 0
//     );
//   }

//   getSearchTermsByType(type: AutoTargetingType): SearchTerm[] {
//     return this.searchTerms.filter(st => st.targetingType === type);
//   }
// }










// // Targeting Type-Specific Rules



// // Rules Engine Executor
// export class AutoCampaignOptimizationEngine {
//   private rules: IAutoCampaignRuleDecision[] = [];

//   constructor() {
//     this.initializeDefaultRules(); 
//   }

//   private initializeDefaultRules(): void {
//     this.rules = [
//       // new ProfitableSearchTermsRule(),
//       // new NewProductLaunchRule(),
//       // new LimitedImpressionsHighConversionRule(),
//       // new HighSpendPoorConversionRule(),
//       // new ListingConversionIssuesRule(),
//       // new CloseMatchOptimizationRule(),
//       // new LooseMatchOptimizationRule(),
//       // new SubstituteTargetingOptimizationRule(),
//       // new ComplementaryTargetingOptimizationRule(),
//       // new NegativeKeywordRule(),
//     ];
//   }

//   addRule(rule: IAutoCampaignRuleDecision): void {
//     this.rules.push(rule);
//   }

//   async analyzeAndOptimize(campaign: AutoCampaign): Promise<AutoCampaignAdjustment[]> {
//     const adjustments: AutoCampaignAdjustment[] = [];
//     for (const rule of this.rules) {
//       if (rule.shouldApply(campaign)) {
//         const adjustment = rule.execute(campaign);
//         adjustments.push(adjustment);
//       }
//     }

//     return adjustments;
//   }

//   async analyzeMultipleCampaigns(
//     campaigns: AutoCampaign[]
//   ): Promise<Map<string, AutoCampaignAdjustment[]>> {
//     const results = new Map<string, AutoCampaignAdjustment[]>();

//     for (const campaign of campaigns) {
//       const adjustments = await this.analyzeAndOptimize(campaign);
//       if (adjustments.length > 0) {
//         results.set(campaign.getId(), adjustments);
//       }
//     }

//     return results;
//   }
// }
