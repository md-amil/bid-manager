/**
 * Amazon Ad Manager - Core Optimization Engine
 * Analyzes campaign and keyword performance, applies business rules
 * 
 * Usage:
 * const manager = new AmazonAdManager({ targetAcos: 0.30 });
 * const recommendations = manager.analyzeCampaign(campaign, keywords);
 */

// ============================================================================
// ENUMS & TYPES
// ============================================================================

class AdjustmentAction {
  static INCREASE_BID = 'INCREASE_BID';
  static DECREASE_BID = 'DECREASE_BID';
  static INCREASE_BUDGET = 'INCREASE_BUDGET';
  static DECREASE_BUDGET = 'DECREASE_BUDGET';
  static PAUSE_CAMPAIGN = 'PAUSE_CAMPAIGN';
  static PAUSE_KEYWORD = 'PAUSE_KEYWORD';
  static ADD_NEGATIVE = 'ADD_NEGATIVE';
  static MOVE_TO_MANUAL = 'MOVE_TO_MANUAL';
  static REMOVE_KEYWORD = 'REMOVE_KEYWORD';
}

class CampaignType {
  static AUTO = 'AUTO';
  static MANUAL = 'MANUAL';
  static BRAND = 'BRAND';
}

// ============================================================================
// DATA STRUCTURES
// ============================================================================

/**
 * Performance metrics for campaign or keyword
 */
class PerformanceMetrics {
  constructor({
    clicks = 0,
    spend = 0,
    sales = 0,
    unitsSold = 0,
    impressions = 0,
    ctr = 0,
    acos = null,
    cpc = 0,
    convRate = 0
  } = {}) {
    this.clicks = clicks;
    this.spend = spend;
    this.sales = sales;
    this.unitsSold = unitsSold;
    this.impressions = impressions;
    this.ctr = ctr; // Click through rate
    this.acos = acos; // Advertising Cost of Sale
    this.cpc = cpc; // Cost per click
    this.convRate = convRate; // Conversion rate (sales/clicks)
  }
}

/**
 * Campaign configuration
 */
class CampaignConfig {
  constructor({
    campaignId = '',
    campaignName = '',
    campaignType = CampaignType.MANUAL,
    budget = 0,
    budgetCurrency = 'INR',
    currentSpend = 0,
    bidStrategy = '',
    targetingType = null // For auto: CLOSE, LOOSE, SUBSTITUTE, COMPLEMENTARY
  } = {}) {
    this.campaignId = campaignId;
    this.campaignName = campaignName;
    this.campaignType = campaignType;
    this.budget = budget;
    this.budgetCurrency = budgetCurrency;
    this.currentSpend = currentSpend;
    this.bidStrategy = bidStrategy;
    this.targetingType = targetingType;
  }
}

/**
 * Keyword/Search term data
 */
class KeywordData {
  constructor({
    keyword = '',
    matchType = 'BROAD',
    bid = 0,
    metrics = new PerformanceMetrics(),
    autoTargeted = false
  } = {}) {
    this.keyword = keyword;
    this.matchType = matchType;
    this.bid = bid;
    this.metrics = metrics;
    this.autoTargeted = autoTargeted;
  }
}

/**
 * Adjustment recommendation output
 */
class AdjustmentRecommendation {
  constructor({
    keywordOrCampaign = '',
    action = AdjustmentAction.INCREASE_BID,
    currentValue = 0,
    recommendedValue = 0,
    percentageChange = 0,
    reason = '',
    priority = 2,
    daysToMonitor = 7
  } = {}) {
    this.keywordOrCampaign = keywordOrCampaign;
    this.action = action;
    this.currentValue = currentValue;
    this.recommendedValue = recommendedValue;
    this.percentageChange = percentageChange;
    this.reason = reason;
    this.priority = priority;
    this.daysToMonitor = daysToMonitor;
  }
}

// ============================================================================
// MAIN MANAGER CLASS
// ============================================================================

class AmazonAdManager {
  /**
   * Initialize the manager
   * @param {Object} config - Configuration options
   * @param {number} config.targetAcos - Target ACOS (e.g., 0.30 = 30%)
   * @param {number} config.minSampleClicks - Minimum clicks for decision
   * @param {number} config.minSampleSpend - Minimum spend for decision
   */
  constructor({
    targetAcos = 0.30,
    minSampleClicks = 20,
    minSampleSpend = 200
  } = {}) {
    this.targetAcos = targetAcos;
    this.minSampleClicks = minSampleClicks;
    this.minSampleSpend = minSampleSpend;
    this.recommendations = [];
  }

  /**
   * Analyze a campaign and return adjustment recommendations
   * @param {CampaignConfig} campaign - Campaign to analyze
   * @param {KeywordData[]} keywords - Keywords in campaign
   * @returns {AdjustmentRecommendation[]} Sorted recommendations
   */
  analyzeCampaign(campaign, keywords) {
    this.recommendations = [];

    if (campaign.campaignType === CampaignType.AUTO) {
      this._analyzeAutoCampaign(campaign, keywords);
    } else {
      this._analyzeManualCampaign(campaign, keywords);
    }

    // Sort by priority (1 = highest)
    this.recommendations.sort((a, b) => a.priority - b.priority);
    return this.recommendations;
  }

  // ========================================================================
  // AUTO CAMPAIGN ANALYSIS
  // ========================================================================

  _analyzeAutoCampaign(campaign, keywords) {
    // Rule 1: Auto Campaign Generating Profitable Search Terms
    if (this._isGeneratingProfitableSales(keywords)) {
      this.recommendations.push(
        new AdjustmentRecommendation({
          keywordOrCampaign: campaign.campaignId,
          action: AdjustmentAction.INCREASE_BUDGET,
          currentValue: campaign.budget,
          recommendedValue: campaign.budget * 1.25,
          percentageChange: 25,
          reason: 'Auto campaign producing consistent profitable sales with acceptable ACOS',
          priority: 1
        })
      );

      // Also recommend moving winners to manual campaigns
      for (const kw of keywords) {
        if (this._shouldMoveToManual(kw)) {
          this.recommendations.push(
            new AdjustmentRecommendation({
              keywordOrCampaign: kw.keyword,
              action: AdjustmentAction.MOVE_TO_MANUAL,
              currentValue: kw.bid,
              recommendedValue: kw.bid * 1.2,
              percentageChange: 20,
              reason: `Search term has ${kw.metrics.sales} sales with ${(kw.metrics.acos * 100).toFixed(2)}% ACOS - move to exact/phrase match`,
              priority: 2
            })
          );
        }
      }
    }

    // Rule 2: Launch Phase - keep broad discovery
    if (this._isNewProductLaunch(keywords)) {
      this.recommendations.push(
        new AdjustmentRecommendation({
          keywordOrCampaign: campaign.campaignId,
          action: AdjustmentAction.INCREASE_BID,
          currentValue: campaign.currentSpend,
          recommendedValue: campaign.currentSpend * 1.1,
          percentageChange: 10,
          reason: 'New product launch phase - use suggested bids for discovery',
          priority: 3
        })
      );
    }

    // Rule 3: Good Conversion with Limited Impressions
    if (this._hasGoodConversionLowImpressions(campaign, keywords)) {
      this.recommendations.push(
        new AdjustmentRecommendation({
          keywordOrCampaign: campaign.campaignId,
          action: AdjustmentAction.INCREASE_BID,
          currentValue: campaign.currentSpend,
          recommendedValue: campaign.currentSpend * 1.25,
          percentageChange: 25,
          reason: 'Good conversion rate but limited impressions - increase bids to unlock more inventory',
          priority: 2
        })
      );
    }

    // DECREASE RULES
    const totalClicks = keywords.reduce((sum, kw) => sum + kw.metrics.clicks, 0);
    const totalSpend = keywords.reduce((sum, kw) => sum + kw.metrics.spend, 0);
    const totalSales = keywords.reduce((sum, kw) => sum + kw.metrics.sales, 0);

    if (totalClicks > 50 && totalSales === 0 && totalSpend > 0) {
      this.recommendations.push(
        new AdjustmentRecommendation({
          keywordOrCampaign: campaign.campaignId,
          action: AdjustmentAction.DECREASE_BID,
          currentValue: campaign.currentSpend,
          recommendedValue: campaign.currentSpend * 0.75,
          percentageChange: -25,
          reason: `High clicks (${totalClicks}) with zero sales and rising ACOS`,
          priority: 1
        })
      );
    }

    // Negative keyword rules
    for (const kw of keywords) {
      if (this._shouldAddNegative(kw)) {
        this.recommendations.push(
          new AdjustmentRecommendation({
            keywordOrCampaign: kw.keyword,
            action: AdjustmentAction.ADD_NEGATIVE,
            currentValue: kw.bid,
            recommendedValue: 0,
            percentageChange: -100,
            reason: `High spend (₹${kw.metrics.spend.toFixed(2)}) with zero sales - add as negative`,
            priority: 2
          })
        );
      }
    }

    // Per-targeting-type adjustments
    this._analyzeTargetingTypeAdjustments(campaign, keywords);
  }

  // ========================================================================
  // MANUAL CAMPAIGN ANALYSIS
  // ========================================================================

  _analyzeManualCampaign(campaign, keywords) {
    for (const kw of keywords) {
      // INCREASE BID RULES

      // Rule 1: Profitable Keywords (Low ACOS)
      if (kw.metrics.acos && kw.metrics.acos <= this.targetAcos && kw.metrics.sales > 0) {
        this.recommendations.push(
          new AdjustmentRecommendation({
            keywordOrCampaign: kw.keyword,
            action: AdjustmentAction.INCREASE_BID,
            currentValue: kw.bid,
            recommendedValue: kw.bid * 1.15,
            percentageChange: 15,
            reason: `Profitable keyword with ${(kw.metrics.acos * 100).toFixed(2)}% ACOS (below target)`,
            priority: 1,
            daysToMonitor: 5
          })
        );
      }

      // Rule 2: High Sales but Low Impressions
      if (kw.metrics.impressions < 100 && kw.metrics.sales > 0 &&
          (kw.metrics.acos === null || kw.metrics.acos <= this.targetAcos)) {
        this.recommendations.push(
          new AdjustmentRecommendation({
            keywordOrCampaign: kw.keyword,
            action: AdjustmentAction.INCREASE_BID,
            currentValue: kw.bid,
            recommendedValue: kw.bid * 1.15,
            percentageChange: 15,
            reason: `High conversion with low visibility (${kw.metrics.impressions} impressions)`,
            priority: 2,
            daysToMonitor: 5
          })
        );
      }

      // Rule 3: Competitor ASIN Targeting Converting
      if (kw.keyword.toLowerCase().includes('competitor') && kw.metrics.sales > 0) {
        if (kw.metrics.acos === null || kw.metrics.acos <= this.targetAcos) {
          this.recommendations.push(
            new AdjustmentRecommendation({
              keywordOrCampaign: kw.keyword,
              action: AdjustmentAction.INCREASE_BID,
              currentValue: kw.bid,
              recommendedValue: kw.bid * 1.15,
              percentageChange: 15,
              reason: 'Competitor ASIN targeting converting within acceptable ACOS',
              priority: 2
            })
          );
        }
      }

      // DECREASE BID RULES

      // Rule 1: High ACOS Keywords
      if (kw.metrics.acos && kw.metrics.acos > this.targetAcos) {
        this.recommendations.push(
          new AdjustmentRecommendation({
            keywordOrCampaign: kw.keyword,
            action: AdjustmentAction.DECREASE_BID,
            currentValue: kw.bid,
            recommendedValue: kw.bid * 0.75,
            percentageChange: -25,
            reason: `High ACOS ${(kw.metrics.acos * 100).toFixed(2)}% (above ${(this.targetAcos * 100).toFixed(2)}% target)`,
            priority: 1,
            daysToMonitor: 7
          })
        );
      }

      // Rule 2: Keywords Getting Clicks but No Sales
      if (kw.metrics.clicks >= this.minSampleClicks && kw.metrics.sales === 0) {
        this.recommendations.push(
          new AdjustmentRecommendation({
            keywordOrCampaign: kw.keyword,
            action: AdjustmentAction.DECREASE_BID,
            currentValue: kw.bid,
            recommendedValue: kw.bid * 0.75,
            percentageChange: -25,
            reason: `No sales from ${kw.metrics.clicks} clicks`,
            priority: 1,
            daysToMonitor: 7
          })
        );
      }

      // Rule 3: Listing Conversion Issues
      if (kw.metrics.clicks > 10 && kw.metrics.impressions > 100 && kw.metrics.sales === 0) {
        this.recommendations.push(
          new AdjustmentRecommendation({
            keywordOrCampaign: kw.keyword,
            action: AdjustmentAction.DECREASE_BID,
            currentValue: kw.bid,
            recommendedValue: kw.bid * 0.5,
            percentageChange: -50,
            reason: 'Good traffic but zero sales - likely listing conversion issue',
            priority: 1
          })
        );
      }
    }
  }

  // ========================================================================
  // HELPER METHODS
  // ========================================================================

  _isGeneratingProfitableSales(keywords) {
    const profitableKeywords = keywords.filter(kw =>
      kw.metrics.sales >= 2 &&
      (kw.metrics.acos === null || kw.metrics.acos <= this.targetAcos)
    );
    return profitableKeywords.length > 0;
  }

  // _shouldMoveToManual(keyword) {
  //   return (
  //     keyword.autoTargeted &&
  //     keyword.metrics.sales >= 2 &&
  //     (keyword.metrics.acos === null || keyword.metrics.acos <= this.targetAcos) &&
  //     keyword.metrics.clicks >= 5
  //   );
  // }

  _isNewProductLaunch(keywords) {
    const totalSales = keywords.reduce((sum, kw) => sum + kw.metrics.sales, 0);
    const totalClicks = keywords.reduce((sum, kw) => sum + kw.metrics.clicks, 0);
    return totalSales === 0 && totalClicks < 100;
  }

  // _hasGoodConversionLowImpressions(campaign, keywords) {
  //   if (keywords.length === 0) return false;

  //   const totalImpressions = keywords.reduce((sum, kw) => sum + kw.metrics.impressions, 0);
  //   const totalClicks = keywords.reduce((sum, kw) => sum + kw.metrics.clicks, 0);
  //   const totalSales = keywords.reduce((sum, kw) => sum + kw.metrics.sales, 0);

  //   if (totalClicks === 0) return false;

  //   const convRate = totalSales / totalClicks;
  //   const budgetUtilized = campaign.budget > 0 ? campaign.currentSpend / campaign.budget : 0;

  //   return convRate > 0.05 && totalImpressions < 500 && budgetUtilized < 0.7;
  // }

  _shouldAddNegative(keyword) {
    return (
      (keyword.metrics.clicks >= this.minSampleClicks ||
        keyword.metrics.spend >= this.minSampleSpend) &&
      keyword.metrics.sales === 0
    );
  }

  _analyzeTargetingTypeAdjustments(campaign, keywords) {
    const targetingType = campaign.targetingType;
    if (!targetingType) return;

    const metricsData = keywords;
    if (metricsData.length === 0) return;

    const totalSales = metricsData.reduce((sum, kw) => sum + kw.metrics.sales, 0);
    const totalSpend = metricsData.reduce((sum, kw) => sum + kw.metrics.spend, 0);
    const totalAcos = totalSales > 0 ? totalSpend / totalSales : null;

    // CLOSE MATCH
    if (targetingType === 'CLOSE') {
      if (totalSales > 0 && (totalAcos === null || totalAcos <= this.targetAcos)) {
        this.recommendations.push(
          new AdjustmentRecommendation({
            keywordOrCampaign: `${campaign.campaignId}_CLOSE`,
            action: AdjustmentAction.INCREASE_BID,
            currentValue: campaign.currentSpend,
            recommendedValue: campaign.currentSpend * 1.2,
            percentageChange: 20,
            reason: totalAcos ? `Close match converting well with ${(totalAcos * 100).toFixed(2)}% ACOS` : 'Close match converting well',
            priority: 2
          })
        );
      } else if (totalSpend > 300 && totalSales === 0) {
        this.recommendations.push(
          new AdjustmentRecommendation({
            keywordOrCampaign: `${campaign.campaignId}_CLOSE`,
            action: AdjustmentAction.DECREASE_BID,
            currentValue: campaign.currentSpend,
            recommendedValue: campaign.currentSpend * 0.5,
            percentageChange: -50,
            reason: `Close match spent ₹${totalSpend.toFixed(2)} with zero sales`,
            priority: 1
          })
        );
      }
    }

    // LOOSE MATCH
    if (targetingType === 'LOOSE') {
      const totalClicks = metricsData.reduce((sum, kw) => sum + kw.metrics.clicks, 0);
      const totalImpressions = metricsData.reduce((sum, kw) => sum + kw.metrics.impressions, 0);
      const cpc = totalClicks > 0 ? totalSpend / totalClicks : 0;
      const ctr = totalImpressions > 0 ? totalClicks / totalImpressions : 0;

      if (cpc > 0 && cpc < 50 && ctr > 0.01) {
        this.recommendations.push(
          new AdjustmentRecommendation({
            keywordOrCampaign: `${campaign.campaignId}_LOOSE`,
            action: AdjustmentAction.INCREASE_BID,
            currentValue: campaign.currentSpend,
            recommendedValue: campaign.currentSpend * 1.2,
            percentageChange: 20,
            reason: 'Loose match with low CPC and decent CTR - expand reach',
            priority: 3
          })
        );
      } else if (totalAcos && totalAcos > this.targetAcos * 1.5) {
        this.recommendations.push(
          new AdjustmentRecommendation({
            keywordOrCampaign: `${campaign.campaignId}_LOOSE`,
            action: AdjustmentAction.DECREASE_BID,
            currentValue: campaign.currentSpend,
            recommendedValue: campaign.currentSpend * 0.5,
            percentageChange: -50,
            reason: 'Loose match traffic too generic with high ACOS',
            priority: 1
          })
        );
      }
    }

    // SUBSTITUTE
    if (targetingType === 'SUBSTITUTE') {
      if (totalSales > 0 && (totalAcos === null || totalAcos <= this.targetAcos)) {
        this.recommendations.push(
          new AdjustmentRecommendation({
            keywordOrCampaign: `${campaign.campaignId}_SUBSTITUTE`,
            action: AdjustmentAction.INCREASE_BID,
            currentValue: campaign.currentSpend,
            recommendedValue: campaign.currentSpend * 1.25,
            percentageChange: 25,
            reason: 'Competitor ASIN targeting converting within acceptable ACOS',
            priority: 2
          })
        );
      } else if (totalSales === 0 && totalSpend > 150) {
        this.recommendations.push(
          new AdjustmentRecommendation({
            keywordOrCampaign: `${campaign.campaignId}_SUBSTITUTE`,
            action: AdjustmentAction.DECREASE_BID,
            currentValue: campaign.currentSpend,
            recommendedValue: campaign.currentSpend * 0.5,
            percentageChange: -50,
            reason: 'Competitor targeting high clicks but zero sales',
            priority: 1
          })
        );
      }
    }

    // COMPLEMENTARY
    if (targetingType === 'COMPLEMENTARY') {
      if (totalSales > 0 && (totalAcos === null || totalAcos <= this.targetAcos)) {
        this.recommendations.push(
          new AdjustmentRecommendation({
            keywordOrCampaign: `${campaign.campaignId}_COMPLEMENTARY`,
            action: AdjustmentAction.INCREASE_BID,
            currentValue: campaign.currentSpend,
            recommendedValue: campaign.currentSpend * 1.25,
            percentageChange: 25,
            reason: 'Complementary products generating incremental sales',
            priority: 2
          })
        );
      } else if (totalAcos && totalAcos > this.targetAcos && totalSales > 0) {
        this.recommendations.push(
          new AdjustmentRecommendation({
            keywordOrCampaign: `${campaign.campaignId}_COMPLEMENTARY`,
            action: AdjustmentAction.DECREASE_BID,
            currentValue: campaign.currentSpend,
            recommendedValue: campaign.currentSpend * 0.5,
            percentageChange: -50,
            reason: 'Complementary products low relevance with high ACOS',
            priority: 1
          })
        );
      }
    }
  }
}

// ============================================================================
// REPORT GENERATION
// ============================================================================

/**
 * Generate formatted report from recommendations
 * @param {AdjustmentRecommendation[]} recommendations - Recommendations to report
 * @returns {string} Formatted report
 */
function generateReport(recommendations) {
  const now = new Date().toISOString().split('T')[0];
  let report = '='.repeat(100) + '\n';
  report += 'AMAZON AD MANAGER - OPTIMIZATION RECOMMENDATIONS\n';
  report += `Generated: ${now}\n`;
  report += '='.repeat(100) + '\n\n';

  if (recommendations.length === 0) {
    report += '✓ No optimization needed. All campaigns performing as expected.\n';
    return report;
  }

  // Group by priority
  const byPriority = {};
  for (const rec of recommendations) {
    if (!byPriority[rec.priority]) {
      byPriority[rec.priority] = [];
    }
    byPriority[rec.priority].push(rec);
  }

  // Format by priority
  const priorityLabels = {
    1: '🔴 CRITICAL - Action Required',
    2: '🟡 HIGH - Recommended',
    3: '🟢 MEDIUM - Consider'
  };

  for (const priority of Object.keys(byPriority).sort((a, b) => a - b)) {
    const label = priorityLabels[priority] || 'INFO';
    report += `\n${label}\n`;
    report += '-'.repeat(100) + '\n';

    const recs = byPriority[priority];
    for (let i = 0; i < recs.length; i++) {
      const rec = recs[i];
      report += `\n${i + 1}. ${rec.keywordOrCampaign}\n`;
      report += `   Action: ${rec.action}\n`;
      report += `   Current Value: ₹${rec.currentValue.toFixed(2)}\n`;
      report += `   Recommended: ₹${rec.recommendedValue.toFixed(2)}\n`;
      report += `   Change: ${rec.percentageChange > 0 ? '+' : ''}${rec.percentageChange.toFixed(1)}%\n`;
      report += `   Reason: ${rec.reason}\n`;
      report += `   Monitor for: ${rec.daysToMonitor} days\n`;
    }
  }

  return report;
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  AmazonAdManager,
  AdjustmentAction,
  CampaignType,
  CampaignConfig,
  KeywordData,
  PerformanceMetrics,
  AdjustmentRecommendation,
  generateReport
};
