/**
 * Amazon Ad Manager - Example Usage & Data Integration
 * Shows how to parse reports and integrate with your data
 */

const {
  AmazonAdManager,
  CampaignConfig,
  CampaignType,
  KeywordData,
  PerformanceMetrics,
  generateReport
} = require('./amazon-ad-manager');

// ============================================================================
// STEP 1: PARSE CAMPAIGN REPORT
// ============================================================================

/**
 * Convert Amazon campaign report JSON to CampaignConfig
 * 
 * Expected input format:
 * {
 *   campaignId: 182137774636371,
 *   campaignName: "VT - B0FRN797GM",
 *   campaignBudgetAmount: 50.0,
 *   campaignBudgetCurrencyCode: "INR",
 *   spend: 51.68,
 *   clicks: 4,
 *   impressions: 366,
 *   costPerClick: 12.92,
 *   campaignBiddingStrategy: "optimizeForSales"
 * }
 */
function parseCampaignReport(campaignJson) {
  const campaignType = (campaignJson.campaignBiddingStrategy || '').toLowerCase().includes('auto')
    ? CampaignType.AUTO
    : CampaignType.MANUAL;

  return new CampaignConfig({
    campaignId: String(campaignJson.campaignId || ''),
    campaignName: campaignJson.campaignName || 'Unknown',
    campaignType,
    budget: campaignJson.campaignBudgetAmount || 0,
    budgetCurrency: campaignJson.campaignBudgetCurrencyCode || 'USD',
    currentSpend: campaignJson.spend || 0,
    bidStrategy: campaignJson.campaignBiddingStrategy || '',
    targetingType: null
  });
}

// ============================================================================
// STEP 2: PARSE KEYWORD REPORT
// ============================================================================

/**
 * Convert keyword performance report to KeywordData objects
 * 
 * Expected format:
 * [
 *   {
 *     keyword: "summer shoes",
 *     matchType: "EXACT",
 *     bid: 45.50,
 *     clicks: 15,
 *     spend: 682.50,
 *     attributedSales: 1500.00,
 *     impressions: 200,
 *     autoTargeted: false
 *   }
 * ]
 */
function parseKeywordReport(keywordsJson) {
  return keywordsJson.map(kwJson => {
    const clicks = kwJson.clicks || 0;
    const spend = kwJson.spend || 0;
    const sales = kwJson.attributedSales || kwJson.sales || 0;
    const impressions = kwJson.impressions || 0;

    // Calculate ACOS
    let acos = null;
    if (sales > 0) {
      acos = spend / sales;
    }

    // Calculate metrics
    const ctr = impressions > 0 ? clicks / impressions : 0;
    const cpc = clicks > 0 ? spend / clicks : 0;
    const convRate = clicks > 0 ? sales / clicks : 0;

    const metrics = new PerformanceMetrics({
      clicks,
      spend,
      sales,
      unitsSold: kwJson.unitsSold || 0,
      impressions,
      ctr,
      acos,
      cpc,
      convRate
    });

    return new KeywordData({
      keyword: kwJson.keyword || '',
      matchType: kwJson.matchType || 'BROAD',
      bid: kwJson.bid || 0,
      metrics,
      autoTargeted: kwJson.autoTargeted || false
    });
  });
}

// ============================================================================
// STEP 3: EXAMPLE USAGE
// ============================================================================

/**
 * Complete example with your campaign data
 */
function exampleUsage() {
  console.log('='.repeat(80));
  console.log('AMAZON AD MANAGER - EXAMPLE USAGE');
  console.log('='.repeat(80) + '\n');

  // Your actual campaign report
  const yourCampaignReport = {
    date: '2026-02-05',
    campaignId: 182137774636371,
    campaignName: 'VT - B0FRN797GM - 24/1/2026 17:14:04.458',
    campaignStatus: 'ENABLED',
    campaignBudgetType: 'DAILY_BUDGET',
    campaignBudgetAmount: 50.0,
    campaignBudgetCurrencyCode: 'INR',
    spend: 51.68,
    clicks: 4,
    impressions: 366,
    costPerClick: 12.92,
    clickThroughRate: 1.092896174863388,
    campaignBiddingStrategy: 'optimizeForSales',
    topOfSearchImpressionShare: 0.21,
    sales1d: 0,
    sales7d: 0,
    sales14d: 0,
    sales30d: 0
  };

  // Sample keyword report
  const yourKeywordsReport = [
    {
      keyword: 'brown leather shoes',
      matchType: 'BROAD',
      bid: 12.92,
      clicks: 2,
      spend: 25.84,
      impressions: 180,
      sales: 0,
      attributedSales: 0,
      unitsSold: 0,
      autoTargeted: true
    },
    {
      keyword: 'summer footwear',
      matchType: 'BROAD',
      bid: 15.50,
      clicks: 2,
      spend: 25.84,
      impressions: 186,
      sales: 0,
      attributedSales: 0,
      unitsSold: 0,
      autoTargeted: true
    }
  ];

  // Parse campaign
  const campaign = parseCampaignReport(yourCampaignReport);
  console.log(`Campaign: ${campaign.campaignName}`);
  console.log(`Type: ${campaign.campaignType}`);
  console.log(`Budget: ₹${campaign.budget.toFixed(2)}`);
  console.log(`Current Spend: ₹${campaign.currentSpend.toFixed(2)}`);
  console.log(`Overspent by: ₹${(campaign.currentSpend - campaign.budget).toFixed(2)}\n`);

  // Parse keywords
  const keywords = parseKeywordReport(yourKeywordsReport);
  console.log(`Keywords in report: ${keywords.length}`);
  for (const kw of keywords) {
    console.log(`  - ${kw.keyword}: ${kw.metrics.clicks} clicks, ₹${kw.metrics.spend.toFixed(2)} spend, ${kw.metrics.sales} sales`);
  }
  console.log();

  // Analyze
  const manager = new AmazonAdManager({ targetAcos: 0.30 });
  const recommendations = manager.analyzeCampaign(campaign, keywords);

  // Generate report
  const report = generateReport(recommendations);
  console.log(report);

  console.log('\n' + '='.repeat(80));
  console.log(`Total recommendations: ${recommendations.length}`);
  console.log('='.repeat(80));

  return recommendations;
}

// ============================================================================
// AMAZON ADS API INTEGRATION
// ============================================================================

/**
 * Amazon Ads API Integration Class
 * Requires: npm install amazon-advertising
 */
class AmazonAdsIntegration {
  /**
   * Initialize connection to Amazon Ads
   * @param {string} accessToken - OAuth access token
   * @param {string} profileId - Amazon Ads profile ID
   * @param {string} region - Advertiser region (IN, US, EU, etc.)
   */
  constructor(accessToken, profileId, region = 'IN') {
    this.accessToken = accessToken;
    this.profileId = profileId;
    this.region = region;
    this.baseUrl = 'https://advertising-api.amazon.com';
  }

  /**
   * Fetch campaign performance report
   * @param {string} campaignId - Campaign ID
   * @param {Object} dateRange - {startDate: 'YYYYMMDD', endDate: 'YYYYMMDD'}
   */
  async getCampaignReport(campaignId, dateRange = null) {
    const endpoint = `${this.baseUrl}/v2/campaigns/${campaignId}`;
    const headers = {
      'Authorization': `Bearer ${this.accessToken}`,
      'Amazon-Advertising-API-ClientId': this.profileId,
      'Content-Type': 'application/json'
    };

    try {
      const response = await fetch(endpoint, { headers });
      if (!response.ok) throw new Error(`API Error: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error(`Failed to fetch campaign ${campaignId}:`, error);
      throw error;
    }
  }

  /**
   * Fetch keyword performance report
   */
  async getKeywordReport(campaignId, dateRange = null) {
    console.log(`Would fetch keyword report from Amazon Ads API for ${campaignId}`);
    // Implementation would call actual API
    return [];
  }

  /**
   * Update campaign daily budget
   */
  async updateCampaignBudget(campaignId, newBudget) {
    console.log(`Would update campaign ${campaignId} budget to ₹${newBudget.toFixed(2)}`);
    // Implementation would call actual API
  }

  /**
   * Update keyword bid
   */
  async updateKeywordBid(keywordId, newBid) {
    console.log(`Would update keyword ${keywordId} bid to ₹${newBid.toFixed(2)}`);
    // Implementation would call actual API
  }

  /**
   * Apply all recommendations
   */
  async applyRecommendations(recommendations) {
    for (const rec of recommendations) {
      const actionMap = {
        'INCREASE_BUDGET': () => this.updateCampaignBudget(rec.keywordOrCampaign, rec.recommendedValue),
        'DECREASE_BUDGET': () => this.updateCampaignBudget(rec.keywordOrCampaign, rec.recommendedValue),
        'INCREASE_BID': () => this.updateKeywordBid(rec.keywordOrCampaign, rec.recommendedValue),
        'DECREASE_BID': () => this.updateKeywordBid(rec.keywordOrCampaign, rec.recommendedValue)
      };

      if (actionMap[rec.action]) {
        await actionMap[rec.action]();
      }
    }
  }
}

// ============================================================================
// AUTOMATION WORKFLOW
// ============================================================================

/**
 * Automated optimization workflow
 */
class AutomationWorkflow {
  constructor(manager, apiIntegration = null) {
    this.manager = manager;
    this.api = apiIntegration;
    this.executionLog = [];
  }

  /**
   * Run complete optimization cycle
   * @param {string[]} campaignIds - Campaign IDs to analyze
   */
  async runOptimizationCycle(campaignIds) {
    console.log(`Starting optimization cycle for ${campaignIds.length} campaigns...`);

    for (const campaignId of campaignIds) {
      try {
        // Fetch data (from API or CSV)
        const campaignData = await this._fetchCampaignData(campaignId);
        const keywordData = await this._fetchKeywordData(campaignId);

        // Parse
        const campaign = parseCampaignReport(campaignData);
        const keywords = parseKeywordReport(keywordData);

        // Analyze
        const recommendations = this.manager.analyzeCampaign(campaign, keywords);

        // Apply (optional)
        if (this.api && recommendations.length > 0) {
          await this.api.applyRecommendations(recommendations);
        }

        // Log
        this.executionLog.push({
          timestamp: new Date().toISOString(),
          campaignId,
          recommendationsCount: recommendations.length,
          status: 'SUCCESS'
        });

        console.log(`✓ Campaign ${campaignId}: ${recommendations.length} recommendations`);
      } catch (error) {
        this.executionLog.push({
          timestamp: new Date().toISOString(),
          campaignId,
          error: error.message,
          status: 'FAILED'
        });
        console.log(`✗ Campaign ${campaignId}: ${error.message}`);
      }
    }
  }

  async _fetchCampaignData(campaignId) {
    return {};
  }

  async _fetchKeywordData(campaignId) {
    return [];
  }

  /**
   * Save execution log
   */
  saveExecutionLog(filepath) {
    const fs = require('fs');
    fs.writeFileSync(filepath, JSON.stringify(this.executionLog, null, 2));
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  parseCampaignReport,
  parseKeywordReport,
  exampleUsage,
  AmazonAdsIntegration,
  AutomationWorkflow
};

// Run example if this file is executed directly
if (require.main === module) {
  exampleUsage();
}
