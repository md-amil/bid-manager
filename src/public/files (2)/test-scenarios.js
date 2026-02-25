/**
 * Amazon Ad Manager - Test Scenarios
 * 7 realistic scenarios demonstrating all rules
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
// SCENARIO 1: Auto Campaign Generating Profitable Sales
// ============================================================================

function testScenario1() {
  console.log('\n' + '='.repeat(100));
  console.log('SCENARIO 1: Auto Campaign Generating Profitable Sales');
  console.log('='.repeat(100));

  const campaign = new CampaignConfig({
    campaignId: 'auto_001',
    campaignName: 'Auto - Electronics',
    campaignType: CampaignType.AUTO,
    budget: 100.0,
    budgetCurrency: 'INR',
    currentSpend: 75.0,
    bidStrategy: 'optimizeForSales',
    targetingType: 'CLOSE'
  });

  const keywords = [
    new KeywordData({
      keyword: 'wireless earbuds',
      matchType: 'BROAD',
      bid: 25.0,
      metrics: new PerformanceMetrics({
        clicks: 20, spend: 500.0, sales: 10, unitsSold: 10,
        impressions: 200, ctr: 0.10, acos: 0.50, cpc: 25.0, convRate: 0.50
      }),
      autoTargeted: true
    }),
    new KeywordData({
      keyword: 'bluetooth headphones',
      matchType: 'BROAD',
      bid: 30.0,
      metrics: new PerformanceMetrics({
        clicks: 15, spend: 450.0, sales: 8, unitsSold: 8,
        impressions: 180, ctr: 0.083, acos: 0.56, cpc: 30.0, convRate: 0.533
      }),
      autoTargeted: true
    }),
    new KeywordData({
      keyword: 'useless search term',
      matchType: 'BROAD',
      bid: 20.0,
      metrics: new PerformanceMetrics({
        clicks: 2, spend: 40.0, sales: 0, unitsSold: 0,
        impressions: 50, ctr: 0.04, acos: null, cpc: 20.0, convRate: 0.0
      }),
      autoTargeted: true
    })
  ];

  const manager = new AmazonAdManager({ targetAcos: 0.30 });
  const recommendations = manager.analyzeCampaign(campaign, keywords);
  console.log(generateReport(recommendations));
  return recommendations;
}

// ============================================================================
// SCENARIO 2: High Spend with Poor Conversion
// ============================================================================

function testScenario2() {
  console.log('\n' + '='.repeat(100));
  console.log('SCENARIO 2: High Spend with Poor Conversion');
  console.log('='.repeat(100));

  const campaign = new CampaignConfig({
    campaignId: 'manual_001',
    campaignName: 'Manual - Fashion',
    campaignType: CampaignType.MANUAL,
    budget: 200.0,
    budgetCurrency: 'INR',
    currentSpend: 190.0,
    bidStrategy: 'manualBidding'
  });

  const keywords = [
    new KeywordData({
      keyword: 'summer shoes',
      matchType: 'EXACT',
      bid: 45.50,
      metrics: new PerformanceMetrics({
        clicks: 35, spend: 1592.50, sales: 0, unitsSold: 0,
        impressions: 400, ctr: 0.0875, acos: null, cpc: 45.5, convRate: 0.0
      }),
      autoTargeted: false
    }),
    new KeywordData({
      keyword: 'leather footwear',
      matchType: 'PHRASE',
      bid: 40.0,
      metrics: new PerformanceMetrics({
        clicks: 25, spend: 1000.0, sales: 0, unitsSold: 0,
        impressions: 300, ctr: 0.083, acos: null, cpc: 40.0, convRate: 0.0
      }),
      autoTargeted: false
    })
  ];

  const manager = new AmazonAdManager({ targetAcos: 0.30 });
  const recommendations = manager.analyzeCampaign(campaign, keywords);
  console.log(generateReport(recommendations));
  return recommendations;
}

// ============================================================================
// SCENARIO 3: Good Conversion with Limited Impressions
// ============================================================================

function testScenario3() {
  console.log('\n' + '='.repeat(100));
  console.log('SCENARIO 3: Good Conversion with Limited Impressions');
  console.log('='.repeat(100));

  const campaign = new CampaignConfig({
    campaignId: 'auto_002',
    campaignName: 'Auto - Home Decor',
    campaignType: CampaignType.AUTO,
    budget: 150.0,
    budgetCurrency: 'INR',
    currentSpend: 50.0,
    bidStrategy: 'optimizeForSales',
    targetingType: 'LOOSE'
  });

  const keywords = [
    new KeywordData({
      keyword: 'wall decoration',
      matchType: 'BROAD',
      bid: 15.0,
      metrics: new PerformanceMetrics({
        clicks: 8, spend: 120.0, sales: 2, unitsSold: 2,
        impressions: 80, ctr: 0.10, acos: 0.60, cpc: 15.0, convRate: 0.25
      }),
      autoTargeted: true
    }),
    new KeywordData({
      keyword: 'home art',
      matchType: 'BROAD',
      bid: 12.0,
      metrics: new PerformanceMetrics({
        clicks: 5, spend: 60.0, sales: 1, unitsSold: 1,
        impressions: 70, ctr: 0.071, acos: 0.60, cpc: 12.0, convRate: 0.20
      }),
      autoTargeted: true
    })
  ];

  const manager = new AmazonAdManager({ targetAcos: 0.30 });
  const recommendations = manager.analyzeCampaign(campaign, keywords);
  console.log(generateReport(recommendations));
  return recommendations;
}

// ============================================================================
// SCENARIO 4: High ACOS Keywords
// ============================================================================

function testScenario4() {
  console.log('\n' + '='.repeat(100));
  console.log('SCENARIO 4: High ACOS Keywords (Unprofitable)');
  console.log('='.repeat(100));

  const campaign = new CampaignConfig({
    campaignId: 'manual_002',
    campaignName: 'Manual - Premium Products',
    campaignType: CampaignType.MANUAL,
    budget: 250.0,
    budgetCurrency: 'INR',
    currentSpend: 200.0,
    bidStrategy: 'manualBidding'
  });

  const keywords = [
    new KeywordData({
      keyword: 'luxury watch',
      matchType: 'EXACT',
      bid: 75.0,
      metrics: new PerformanceMetrics({
        clicks: 8, spend: 600.0, sales: 1, unitsSold: 1,
        impressions: 150, ctr: 0.053, acos: 0.60, cpc: 75.0, convRate: 0.125
      }),
      autoTargeted: false
    }),
    new KeywordData({
      keyword: 'designer bag',
      matchType: 'PHRASE',
      bid: 80.0,
      metrics: new PerformanceMetrics({
        clicks: 6, spend: 480.0, sales: 0, unitsSold: 0,
        impressions: 120, ctr: 0.05, acos: null, cpc: 80.0, convRate: 0.0
      }),
      autoTargeted: false
    }),
    new KeywordData({
      keyword: 'premium accessories',
      matchType: 'PHRASE',
      bid: 60.0,
      metrics: new PerformanceMetrics({
        clicks: 10, spend: 600.0, sales: 1, unitsSold: 1,
        impressions: 200, ctr: 0.05, acos: 0.60, cpc: 60.0, convRate: 0.10
      }),
      autoTargeted: false
    })
  ];

  const manager = new AmazonAdManager({ targetAcos: 0.30 });
  const recommendations = manager.analyzeCampaign(campaign, keywords);
  console.log(generateReport(recommendations));
  return recommendations;
}

// ============================================================================
// SCENARIO 5: New Product Launch
// ============================================================================

function testScenario5() {
  console.log('\n' + '='.repeat(100));
  console.log('SCENARIO 5: New Product Launch Phase');
  console.log('='.repeat(100));

  const campaign = new CampaignConfig({
    campaignId: 'auto_003',
    campaignName: 'Auto - New Product Launch',
    campaignType: CampaignType.AUTO,
    budget: 100.0,
    budgetCurrency: 'INR',
    currentSpend: 45.0,
    bidStrategy: 'optimizeForSales',
    targetingType: 'CLOSE'
  });

  const keywords = [
    new KeywordData({
      keyword: 'new innovative gadget',
      matchType: 'BROAD',
      bid: 10.0,
      metrics: new PerformanceMetrics({
        clicks: 3, spend: 30.0, sales: 0, unitsSold: 0,
        impressions: 150, ctr: 0.02, acos: null, cpc: 10.0, convRate: 0.0
      }),
      autoTargeted: true
    }),
    new KeywordData({
      keyword: 'tech gadget search',
      matchType: 'BROAD',
      bid: 8.0,
      metrics: new PerformanceMetrics({
        clicks: 2, spend: 16.0, sales: 0, unitsSold: 0,
        impressions: 200, ctr: 0.01, acos: null, cpc: 8.0, convRate: 0.0
      }),
      autoTargeted: true
    })
  ];

  const manager = new AmazonAdManager({ targetAcos: 0.30 });
  const recommendations = manager.analyzeCampaign(campaign, keywords);
  console.log(generateReport(recommendations));
  return recommendations;
}

// ============================================================================
// SCENARIO 6: Complex Campaign with Multiple Issues
// ============================================================================

function testScenario6() {
  console.log('\n' + '='.repeat(100));
  console.log('SCENARIO 6: Complex Campaign with Multiple Issues');
  console.log('='.repeat(100));

  const campaign = new CampaignConfig({
    campaignId: 'manual_003',
    campaignName: 'Manual - Mixed Performance',
    campaignType: CampaignType.MANUAL,
    budget: 300.0,
    budgetCurrency: 'INR',
    currentSpend: 250.0,
    bidStrategy: 'manualBidding'
  });

  const keywords = [
    new KeywordData({
      keyword: 'best selling product',
      matchType: 'EXACT',
      bid: 35.0,
      metrics: new PerformanceMetrics({
        clicks: 20, spend: 700.0, sales: 8, unitsSold: 8,
        impressions: 250, ctr: 0.08, acos: 0.0875, cpc: 35.0, convRate: 0.40
      }),
      autoTargeted: false
    }),
    new KeywordData({
      keyword: 'niche keyword',
      matchType: 'EXACT',
      bid: 28.0,
      metrics: new PerformanceMetrics({
        clicks: 5, spend: 140.0, sales: 2, unitsSold: 2,
        impressions: 50, ctr: 0.10, acos: 0.70, cpc: 28.0, convRate: 0.40
      }),
      autoTargeted: false
    }),
    new KeywordData({
      keyword: 'expensive search term',
      matchType: 'PHRASE',
      bid: 55.0,
      metrics: new PerformanceMetrics({
        clicks: 12, spend: 660.0, sales: 2, unitsSold: 2,
        impressions: 200, ctr: 0.06, acos: 0.33, cpc: 55.0, convRate: 0.167
      }),
      autoTargeted: false
    }),
    new KeywordData({
      keyword: 'irrelevant keyword',
      matchType: 'BROAD',
      bid: 15.0,
      metrics: new PerformanceMetrics({
        clicks: 25, spend: 375.0, sales: 0, unitsSold: 0,
        impressions: 500, ctr: 0.05, acos: null, cpc: 15.0, convRate: 0.0
      }),
      autoTargeted: false
    }),
    new KeywordData({
      keyword: 'wrong intent',
      matchType: 'PHRASE',
      bid: 18.0,
      metrics: new PerformanceMetrics({
        clicks: 12, spend: 216.0, sales: 0, unitsSold: 0,
        impressions: 300, ctr: 0.04, acos: null, cpc: 18.0, convRate: 0.0
      }),
      autoTargeted: false
    })
  ];

  const manager = new AmazonAdManager({ targetAcos: 0.30 });
  const recommendations = manager.analyzeCampaign(campaign, keywords);
  console.log(generateReport(recommendations));
  return recommendations;
}

// ============================================================================
// SCENARIO 7: Competitor ASIN Targeting
// ============================================================================

function testScenario7() {
  console.log('\n' + '='.repeat(100));
  console.log('SCENARIO 7: Competitor ASIN Targeting');
  console.log('='.repeat(100));

  const campaign = new CampaignConfig({
    campaignId: 'manual_004',
    campaignName: 'Manual - Competitor Targeting',
    campaignType: CampaignType.MANUAL,
    budget: 200.0,
    budgetCurrency: 'INR',
    currentSpend: 180.0,
    bidStrategy: 'manualBidding'
  });

  const keywords = [
    new KeywordData({
      keyword: 'competitor_brand_B123456',
      matchType: 'EXACT',
      bid: 32.0,
      metrics: new PerformanceMetrics({
        clicks: 18, spend: 576.0, sales: 5, unitsSold: 5,
        impressions: 220, ctr: 0.082, acos: 0.1152, cpc: 32.0, convRate: 0.278
      }),
      autoTargeted: false
    }),
    new KeywordData({
      keyword: 'competitor_brand_C789012',
      matchType: 'EXACT',
      bid: 38.0,
      metrics: new PerformanceMetrics({
        clicks: 15, spend: 570.0, sales: 0, unitsSold: 0,
        impressions: 300, ctr: 0.05, acos: null, cpc: 38.0, convRate: 0.0
      }),
      autoTargeted: false
    })
  ];

  const manager = new AmazonAdManager({ targetAcos: 0.30 });
  const recommendations = manager.analyzeCampaign(campaign, keywords);
  console.log(generateReport(recommendations));
  return recommendations;
}

// ============================================================================
// RUN ALL SCENARIOS
// ============================================================================

function runAllScenarios() {
  console.log(`
╔════════════════════════════════════════════════════════════════════════════════╗
║                    AMAZON AD MANAGER - TEST SCENARIOS                          ║
║                                                                                ║
║  This demonstrates the system with realistic business scenarios and data      ║
╚════════════════════════════════════════════════════════════════════════════════╝
  `);

  const allRecommendations = [];

  allRecommendations.push(...testScenario1());
  allRecommendations.push(...testScenario2());
  allRecommendations.push(...testScenario3());
  allRecommendations.push(...testScenario4());
  allRecommendations.push(...testScenario5());
  allRecommendations.push(...testScenario6());
  allRecommendations.push(...testScenario7());

  // Summary
  console.log('\n' + '='.repeat(100));
  console.log('OVERALL SUMMARY');
  console.log('='.repeat(100));

  const critical = allRecommendations.filter(r => r.priority === 1);
  const high = allRecommendations.filter(r => r.priority === 2);
  const medium = allRecommendations.filter(r => r.priority === 3);

  console.log(`\nTotal Recommendations: ${allRecommendations.length}`);
  console.log(`  🔴 Critical (Priority 1): ${critical.length}`);
  console.log(`  🟡 High (Priority 2): ${high.length}`);
  console.log(`  🟢 Medium (Priority 3): ${medium.length}`);

  console.log(`\nActions Breakdown:`);
  const actions = {};
  for (const r of allRecommendations) {
    actions[r.action] = (actions[r.action] || 0) + 1;
  }

  for (const [action, count] of Object.entries(actions).sort()) {
    console.log(`  - ${action}: ${count}`);
  }

  console.log('\n' + '='.repeat(100));
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  testScenario1,
  testScenario2,
  testScenario3,
  testScenario4,
  testScenario5,
  testScenario6,
  testScenario7,
  runAllScenarios
};

// Run all scenarios if this file is executed directly
if (require.main === module) {
  runAllScenarios();
}
