class AmazonBidAutomation {
  constructor(clientId, clientSecret, refreshToken, profileId, region = 'eu') {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.refreshToken = refreshToken;
    this.profileId = profileId;
    this.region = region;
    this.baseUrl = `https://advertising-api-${region}.amazon.com`;
    this.accessToken = null;
  }

  async refreshAccessToken() {
    try {
      const url = 'https://api.amazon.com/auth/o2/token';
      const params = new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: this.refreshToken
      });

      const response = await fetch(url, {
        method: 'POST',
        body: params
      });

      const data = await response.json();
      this.accessToken = data.access_token;
      console.log('✓ Access token refreshed');
    } catch (error) {
      console.error('Error refreshing token:', error);
    }
  }

  getHeaders() {
    return {
      'Amazon-Advertising-API-ClientId': this.clientId,
      'Authorization': `Bearer ${this.accessToken}`,
      'Amazon-Advertising-API-Scope': this.profileId,
      'Content-Type': 'application/json'
    };
  }

  // async getKeywords(adGroupId) {
  //   try {
  //     const url = `${this.baseUrl}/sp/adGroups/${adGroupId}/keywords`;
  //     const response = await fetch(url, {
  //       method: 'GET',
  //       headers: this.getHeaders()
  //     });

  //     if (response.ok) {
  //       return await response.json();
  //     } else {
  //       console.error('Error getting keywords:', await response.text());
  //       return [];
  //     }
  //   } catch (error) {
  //     console.error('Fetch error:', error);
  //     return [];
  //   }
  // }

  async getKeywordMetrics(startDate, endDate) {
    try {
      const url = `${this.baseUrl}/reporting/reports`;
      const payload = {
        name: 'Keyword Performance Report',
        startDate: startDate,
        endDate: endDate,
        configuration: {
          adProduct: 'SPONSORED_PRODUCTS',
          reportTypeId: 'spKeywords',
          groupBy: ['KEYWORD'],
          columns: ['impressions', 'clicks', 'cost', 'conversions', 'attributedSales'],
          timeUnit: 'SUMMARY',
          format: 'GZIP_JSON'
        }
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const reportData = await response.json();
        return reportData.reportId;
      } else {
        console.error('Error creating report:', await response.text());
        return null;
      }
    } catch (error) {
      console.error('Fetch error:', error);
      return null;
    }
  }

  async updateKeywordBid(keywordId, newBid) {
    try {
      const url = `${this.baseUrl}/sp/keywords`;
      const payload = [{
        keywordId: keywordId,
        bid: newBid
      }];

      const response = await fetch(url, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(payload)
      });

      if ([200, 207].includes(response.status)) {
        console.log(`✓ Updated keyword ${keywordId} bid to $${newBid.toFixed(2)}`);
        return true;
      } else {
        console.error('Error updating bid:', await response.text());
        return false;
      }
    } catch (error) {
      console.error('Fetch error:', error);
      return false;
    }
  }

  applyBidRules(keywordsData, rules) {
    const updates = [];

    for (const keyword of keywordsData) {
      const cost = keyword.cost || 0;
      const sales = keyword.attributedSales || 0;
      const conversions = keyword.conversions || 0;
      let currentBid = keyword.bid || 0;

      // Calculate ACoS (Advertising Cost of Sales)
      const acos = sales > 0 ? (cost / sales) * 100 : 0;

      // Calculate ROAS
      const roas = cost > 0 ? sales / cost : 0;

      let newBid = currentBid;
      let reason = '';

      // Apply rules
      if (rules.acos_high && acos > rules.acos_high.threshold) {
        const rule = rules.acos_high;
        if (rule.action === 'decrease') {
          newBid = currentBid - rule.amount;
          reason = `High ACoS (${(acos).toFixed(2)}%)`;
        }
      } else if (rules.acos_low && acos < rules.acos_low.threshold) {
        const rule = rules.acos_low;
        if (rule.action === 'increase') {
          newBid = currentBid + rule.amount;
          reason = `Low ACoS (${(acos).toFixed(2)}%)`;
        }
      } else if (rules.roas_low && roas < rules.roas_low.threshold) {
        const rule = rules.roas_low;
        if (rule.action === 'decrease') {
          newBid = currentBid - rule.amount;
          reason = `Low ROAS (${(roas).toFixed(2)})`;
        }
      }

      // Ensure bid doesn't go below minimum
      newBid = Math.max(newBid, 0.10);

      if (newBid !== currentBid) {
        updates.push({
          keywordId: keyword.keywordId,
          currentBid: currentBid,
          newBid: newBid,
          reason: reason,
          acos: acos,
          roas: roas
        });
      }
    }

    return updates;
  }

  async executeAutomation(adGroupId, rules, dryRun = true) {
    console.log('\n' + '='.repeat(60));
    console.log('Running Bid Automation');
    console.log('='.repeat(60) + '\n');

    // Refresh token first
    await this.refreshAccessToken();

    // Get keywords
    const keywords = await this.getKeywords(adGroupId);

    if (keywords.length === 0) {
      console.log('No keywords found');
      return;
    }

    console.log(`Found ${keywords.length} keywords`);

    // Calculate date range (last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const endDate = today.toISOString().split('T')[0];
    const startDate = thirtyDaysAgo.toISOString().split('T')[0];

    // Apply rules
    const updates = this.applyBidRules(keywords, rules);

    if (updates.length === 0) {
      console.log('No bid changes needed based on current rules');
      return;
    }

    console.log(`\nProposed Changes (${updates.length} keywords):`);
    console.log('Keyword ID'.padEnd(20) + 'Current'.padEnd(10) + 'New'.padEnd(10) + 'Reason');
    console.log('-'.repeat(80));

    for (const update of updates) {
      console.log(
        update.keywordId.toString().padEnd(20) +
        `$${update.currentBid.toFixed(2)}`.padEnd(10) +
        `$${update.newBid.toFixed(2)}`.padEnd(10) +
        update.reason
      );
    }

    if (dryRun) {
      console.log('\n[DRY RUN MODE] No changes applied. Set dryRun=false to apply changes.');
    } else {
      console.log('\nApplying changes...');
      for (const update of updates) {
        await this.updateKeywordBid(update.keywordId, update.newBid);
      }
      console.log('✓ All changes applied');
    }
  }
}

// Usage Example
(async () => {
  // Initialize
  const automation = new AmazonBidAutomation(
    'amzn1.application-oa2-client.a02c0bc63d344f36906f8530c9120a09',
    'YOUR_CLIENT_SECRET',
    'YOUR_REFRESH_TOKEN',
    '3838241482724308'
  );

  // Define your bid rules
  const rules = {
    acos_high: {
      threshold: 50,        // If ACoS > 50%
      action: 'decrease',
      amount: 0.10          // Decrease bid by $0.10
    },
    acos_low: {
      threshold: 20,        // If ACoS < 20%
      action: 'increase',
      amount: 0.15          // Increase bid by $0.15
    },
    roas_low: {
      threshold: 2.0,       // If ROAS < 2.0
      action: 'decrease',
      amount: 0.05
    }
  };

  // Run automation (dryRun=true to preview changes first)
  await automation.executeAutomation(
    'YOUR_AD_GROUP_ID',
    rules,
    true  // Change to false to apply changes
  );
})();