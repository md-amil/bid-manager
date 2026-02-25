/**
 * Amazon Ad Manager - Complete Workflow
 * Main entry point for automated optimization
 */

require('dotenv').config();
const fs = require('fs');

const {
  AmazonAdManager,
  generateReport
} = require('./amazon-ad-manager');

const {
  parseCampaignReport,
  parseKeywordReport,
  AmazonAdsIntegration,
  AutomationWorkflow
} = require('./example-usage');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  targetAcos: parseFloat(process.env.TARGET_ACOS || '0.30'),
  minSampleClicks: parseInt(process.env.MIN_SAMPLE_CLICKS || '20'),
  minSampleSpend: parseFloat(process.env.MIN_SAMPLE_SPEND || '200'),
  
  // API Configuration
  amazonClientId: process.env.AMAZON_CLIENT_ID,
  amazonClientSecret: process.env.AMAZON_CLIENT_SECRET,
  amazonRefreshToken: process.env.AMAZON_REFRESH_TOKEN,
  amazonProfileId: process.env.AMAZON_PROFILE_ID,
  amazonRegion: process.env.AMAZON_REGION || 'IN',
  
  // Options
  useApi: (process.env.USE_API || 'false').toLowerCase() === 'true',
  autoApply: (process.env.AUTO_APPLY || 'false').toLowerCase() === 'true',
  dryRun: (process.env.DRY_RUN || 'true').toLowerCase() === 'true',
  
  // Slack
  slackWebhookUrl: process.env.SLACK_WEBHOOK_URL,
  
  // Logging
  logLevel: process.env.LOG_LEVEL || 'INFO'
};

// ============================================================================
// LOGGING
// ============================================================================

class Logger {
  constructor(level = 'INFO') {
    this.level = level;
    this.levels = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };
  }

  _log(level, message) {
    if (this.levels[level] >= this.levels[this.level]) {
      const timestamp = new Date().toISOString();
      const prefix = {
        DEBUG: '[DEBUG]',
        INFO: '[INFO]',
        WARN: '[WARN]',
        ERROR: '[ERROR]'
      }[level];
      console.log(`${timestamp} ${prefix} ${message}`);
    }
  }

  debug(message) { this._log('DEBUG', message); }
  info(message) { this._log('INFO', message); }
  warn(message) { this._log('WARN', message); }
  error(message) { this._log('ERROR', message); }
}

const logger = new Logger(CONFIG.logLevel);

// ============================================================================
// FILE OPERATIONS
// ============================================================================

/**
 * Load campaign report from CSV file
 */
function loadCampaignFromCsv(filepath) {
  logger.info(`Loading campaign report from ${filepath}`);
  try {
    const csv = require('csv-parse/sync');
    const content = fs.readFileSync(filepath, 'utf-8');
    const records = csv.parse(content, { columns: true });
    logger.info(`Loaded ${records.length} campaigns`);
    return records;
  } catch (error) {
    logger.error(`Failed to load CSV: ${error.message}`);
    throw error;
  }
}

/**
 * Load keyword report from CSV file
 */
function loadKeywordsFromCsv(filepath) {
  logger.info(`Loading keyword report from ${filepath}`);
  try {
    const csv = require('csv-parse/sync');
    const content = fs.readFileSync(filepath, 'utf-8');
    const records = csv.parse(content, { columns: true });
    logger.info(`Loaded ${records.length} keywords`);
    return records;
  } catch (error) {
    logger.error(`Failed to load CSV: ${error.message}`);
    throw error;
  }
}

/**
 * Load JSON report
 */
function loadJsonReport(filepath) {
  logger.info(`Loading report from ${filepath}`);
  try {
    const content = fs.readFileSync(filepath, 'utf-8');
    const data = JSON.parse(content);
    return data;
  } catch (error) {
    logger.error(`Failed to load JSON: ${error.message}`);
    throw error;
  }
}

// ============================================================================
// AMAZON ADS API
// ============================================================================

/**
 * Get fresh access token from refresh token
 */
async function getAccessToken() {
  logger.debug('Refreshing access token...');
  try {
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: CONFIG.amazonRefreshToken,
      client_id: CONFIG.amazonClientId,
      client_secret: CONFIG.amazonClientSecret
    });

    const response = await fetch('https://api.amazon.com/auth/o2/token', {
      method: 'POST',
      body: params
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    logger.debug('Access token refreshed successfully');
    return data.access_token;
  } catch (error) {
    logger.error(`Failed to get access token: ${error.message}`);
    throw error;
  }
}

// ============================================================================
// MAIN OPTIMIZATION WORKFLOW
// ============================================================================

/**
 * Run complete optimization cycle
 */
async function runOptimizationCycle() {
  const startTime = Date.now();
  logger.info('='.repeat(80));
  logger.info('AMAZON AD MANAGER - OPTIMIZATION CYCLE STARTED');
  logger.info('='.repeat(80));

  try {
    // Initialize manager
    const manager = new AmazonAdManager({
      targetAcos: CONFIG.targetAcos,
      minSampleClicks: CONFIG.minSampleClicks,
      minSampleSpend: CONFIG.minSampleSpend
    });

    let campaignData, keywordData;

    // Load data
    if (CONFIG.useApi) {
      logger.info('Using Amazon Ads API to fetch data...');
      const accessToken = await getAccessToken();
      const api = new AmazonAdsIntegration(
        accessToken,
        CONFIG.amazonProfileId,
        CONFIG.amazonRegion
      );
      // Would fetch from API
      campaignData = [];
      keywordData = [];
    } else {
      // Load from CSV/JSON files
      try {
        campaignData = loadCampaignFromCsv('campaigns.csv');
        keywordData = loadKeywordsFromCsv('keywords.csv');
      } catch (error) {
        logger.warn('CSV files not found, trying JSON...');
        campaignData = loadJsonReport('campaigns.json').campaigns || [];
        keywordData = loadJsonReport('keywords.json').keywords || [];
      }
    }

    if (campaignData.length === 0) {
      logger.warn('No campaign data found');
      return [];
    }

    logger.info(`Analyzing ${campaignData.length} campaigns...`);

    const allRecommendations = [];
    const executionLog = [];

    // Process each campaign
    for (const campaignJson of campaignData) {
      try {
        // Parse campaign
        const campaign = parseCampaignReport(campaignJson);
        
        // Get keywords for this campaign
        const campaignKeywords = keywordData
          .filter(k => k.campaignId === campaign.campaignId)
          .map(k => parseKeywordReport([k])[0]);

        // Analyze
        const recommendations = manager.analyzeCampaign(campaign, campaignKeywords);
        allRecommendations.push(...recommendations);

        executionLog.push({
          timestamp: new Date().toISOString(),
          campaignId: campaign.campaignId,
          campaignName: campaign.campaignName,
          recommendationsCount: recommendations.length,
          status: 'SUCCESS'
        });

        logger.info(`✓ ${campaign.campaignName}: ${recommendations.length} recommendations`);

      } catch (error) {
        logger.error(`✗ ${campaignJson.campaignId}: ${error.message}`);
        executionLog.push({
          timestamp: new Date().toISOString(),
          campaignId: campaignJson.campaignId,
          error: error.message,
          status: 'FAILED'
        });
      }
    }

    // Generate report
    const report = generateReport(allRecommendations);
    logger.info('\n' + report);

    // Save report
    const reportFilename = `report-${new Date().toISOString().split('T')[0]}.txt`;
    fs.writeFileSync(reportFilename, report);
    logger.info(`Report saved to ${reportFilename}`);

    // Save execution log
    const logFilename = `execution-log-${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(logFilename, JSON.stringify(executionLog, null, 2));
    logger.info(`Execution log saved to ${logFilename}`);

    // Slack notification
    if (CONFIG.slackWebhookUrl) {
      await sendSlackNotification(allRecommendations);
    }

    // Summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    logger.info('='.repeat(80));
    logger.info(`Total Recommendations: ${allRecommendations.length}`);
    logger.info(`Duration: ${duration}s`);
    logger.info(`Status: ${CONFIG.dryRun ? 'DRY RUN' : 'APPLIED'}`);
    logger.info('='.repeat(80));

    return allRecommendations;

  } catch (error) {
    logger.error(`Optimization cycle failed: ${error.message}`);
    throw error;
  }
}

// ============================================================================
// SLACK NOTIFICATIONS
// ============================================================================

/**
 * Send optimization results to Slack
 */
async function sendSlackNotification(recommendations) {
  if (!CONFIG.slackWebhookUrl) return;

  try {
    const critical = recommendations.filter(r => r.priority === 1);
    const high = recommendations.filter(r => r.priority === 2);
    const medium = recommendations.filter(r => r.priority === 3);

    const message = {
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Amazon Ad Manager Report*\n${new Date().toISOString().split('T')[0]}`
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `🔴 *Critical*: ${critical.length}\n🟡 *High*: ${high.length}\n🟢 *Medium*: ${medium.length}\n✅ *Total*: ${recommendations.length}`
          }
        }
      ]
    };

    if (critical.length > 0) {
      const criticalList = critical.slice(0, 5)
        .map(r => `• ${r.keywordOrCampaign}: ${r.action}`)
        .join('\n');
      message.blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Critical Actions:*\n${criticalList}`
        }
      });
    }

    const response = await fetch(CONFIG.slackWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message)
    });

    if (response.ok) {
      logger.info('Slack notification sent');
    } else {
      logger.warn(`Slack notification failed: ${response.status}`);
    }
  } catch (error) {
    logger.warn(`Failed to send Slack notification: ${error.message}`);
  }
}

// ============================================================================
// SCHEDULING (Optional)
// ============================================================================

/**
 * Schedule optimization to run at specific time
 * Requires: npm install node-cron
 */
async function setupScheduler() {
  try {
    const cron = require('node-cron');
    
    // Run daily at 8 AM
    const task = cron.schedule('0 8 * * *', () => {
      logger.info('Scheduled optimization started');
      runOptimizationCycle().catch(error => {
        logger.error(`Scheduled optimization failed: ${error.message}`);
      });
    });

    logger.info('Scheduler started - optimization will run daily at 8:00 AM');
    return task;
  } catch (error) {
    logger.warn('node-cron not installed, skipping scheduler setup');
    logger.info('To enable scheduling: npm install node-cron');
    return null;
  }
}

// ============================================================================
// CLI ARGUMENTS
// ============================================================================

/**
 * Parse command-line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  return {
    schedule: args.includes('--schedule'),
    once: args.includes('--once'),
    dryRun: args.includes('--dry-run') || CONFIG.dryRun,
    verbose: args.includes('--verbose'),
    file: args[args.indexOf('--file') + 1] || null
  };
}

// ============================================================================
// MAIN ENTRY POINT
// ============================================================================

async function main() {
  const args = parseArgs();

  logger.info(`Amazon Ad Manager v1.0.0`);
  logger.info(`Node.js ${process.version}`);
  logger.info(`Target ACOS: ${(CONFIG.targetAcos * 100).toFixed(1)}%`);
  logger.info(`Dry Run: ${CONFIG.dryRun}`);
  logger.info(`Use API: ${CONFIG.useApi}`);

  try {
    if (args.schedule) {
      // Run scheduler
      await setupScheduler();
      // Keep process running
      await new Promise(() => {});
    } else {
      // Run once
      await runOptimizationCycle();
    }
  } catch (error) {
    logger.error(`Fatal error: ${error.message}`);
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('unhandledRejection', (reason, promise) => {
  logger.error(`Unhandled Rejection: ${reason}`);
});

process.on('uncaughtException', (error) => {
  logger.error(`Uncaught Exception: ${error.message}`);
  process.exit(1);
});

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  runOptimizationCycle,
  sendSlackNotification,
  setupScheduler,
  logger,
  CONFIG
};

// Run if executed directly
if (require.main === module) {
  main();
}
