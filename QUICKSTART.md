# Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### 1. Start MongoDB
```bash
# Option A: Using Docker (recommended)
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Option B: Using local MongoDB
mongod
```

### 2. Configure Environment
The `.env` file is already created. Update it with your Amazon API credentials:

```env
AMAZON_REFRESH_TOKEN=your_actual_refresh_token
AMAZON_CLIENT_ID=your_actual_client_id
AMAZON_CLIENT_SECRET=your_actual_client_secret
```

### 3. Seed Sample Data
```bash
npm run seed
```

This will create 5 sample campaigns with different ROI scenarios:
- Campaign 1: High ROI (5.0) - Will increase bid
- Campaign 2: Medium ROI (2.0) - No change
- Campaign 3: Low ROI (0.83) - Will decrease bid
- Campaign 4: High ROI (4.0) - Will increase bid
- Campaign 5: Low ROI (0.91) - Will decrease bid

### 4. Start the Application
```bash
npm run start:dev
```

The server will start on `http://localhost:3000`

### 5. Test the API

**View all campaigns:**
```bash
curl http://localhost:3000/campaigns
```

**Manually trigger bid adjustment:**
```bash
curl -X POST http://localhost:3000/campaigns/adjust-bids
```

**View adjustment logs:**
```bash
curl http://localhost:3000/campaigns/logs/recent
```

## 📋 What Happens Next?

### Automatic Bid Adjustments
The cron job will automatically run every 4 hours and:
1. Fetch latest campaign data from Amazon API
2. Calculate ROI for each campaign
3. Adjust bids based on performance:
   - **High ROI (≥3.0)**: Bid increases by 15%
   - **Low ROI (≤1.0)**: Bid decreases by 10%
   - **Medium ROI**: No change
4. Update bids via Amazon API
5. Log all changes to the database

### Example Bid Adjustment Flow

**Initial State:**
- Campaign: "wireless headphones"
- Current Bid: $2.50
- Sales: $1,500
- Spend: $300
- ROI: 5.0 (High!)

**After Adjustment:**
- New Bid: $2.88 (increased by 15%)
- Reason: "High ROI (5.00) - Increasing bid"

## 🧪 Testing Without Amazon API

The application is designed to work without actual Amazon API credentials for testing:

1. Create campaigns manually via API:
```bash
curl -X POST http://localhost:3000/campaigns \
  -H "Content-Type: application/json" \
  -d '{
    "campaignId": "test_001",
    "campaignName": "Test Campaign",
    "adGroupId": "adg_test",
    "keyword": "test product",
    "currentBid": 1.50,
    "sales": 500,
    "spend": 100,
    "clicks": 50,
    "impressions": 1000
  }'
```

2. Run bid adjustment:
```bash
curl -X POST http://localhost:3000/campaigns/adjust-bids
```

3. Check the results:
```bash
curl http://localhost:3000/campaigns/test_001
```

## 📊 Monitor Your Campaigns

### View Campaign Details
```bash
curl http://localhost:3000/campaigns/{campaignId}
```

### View Bid History
```bash
curl http://localhost:3000/campaigns/{campaignId}/logs
```

### View Recent Activity
```bash
curl http://localhost:3000/campaigns/logs/recent
```

## ⚙️ Customize Bid Strategy

Edit `.env` to adjust your bidding strategy:

```env
# More aggressive strategy
HIGH_ROI_THRESHOLD=2.5
BID_INCREASE_PERCENTAGE=20

# More conservative strategy  
LOW_ROI_THRESHOLD=1.5
BID_DECREASE_PERCENTAGE=5

# Bid limits
MIN_BID_AMOUNT=0.50
MAX_BID_AMOUNT=15.00
```

## 🔍 Verify Everything is Working

Check the application logs for:
```
[CronService] Starting scheduled bid adjustment job
[BidAdjustmentService] Starting bid adjustment process for all campaigns
[BidAdjustmentService] Found X active campaigns
[BidAdjustmentService] Adjusting bid for campaign...
[CronService] Scheduled bid adjustment job completed successfully
```

## 🎯 Next Steps

1. **Add Real Amazon Credentials**: Update `.env` with your actual Amazon API credentials
2. **Implement OAuth Token Refresh**: Add automatic token refresh in `amazon-api.service.ts`
3. **Monitor Performance**: Watch the logs and adjustment history
4. **Fine-tune Strategy**: Adjust ROI thresholds based on your results
5. **Scale Up**: Add more campaigns and keywords

## 💡 Tips

- Start with conservative thresholds and small percentage changes
- Monitor the first few adjustment cycles closely
- Review logs regularly to ensure bids are adjusting correctly
- Set appropriate min/max bid limits to prevent extreme changes
- Keep an eye on your Amazon Advertising budget

Happy Bidding! 🎉
