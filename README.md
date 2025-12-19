# Amazon Bid Manager

A NestJS application that automatically adjusts Amazon advertising bids based on ROI (Return on Investment). The system monitors campaign performance and increases bids for high-performing campaigns while decreasing bids for underperforming ones.

## Features

- 🤖 **Automated Bid Adjustment**: Automatically adjusts bids every 4 hours based on ROI
- 📊 **ROI-Based Strategy**: 
  - High ROI (≥3.0): Increase bid by 15%
  - Low ROI (≤1.0): Decrease bid by 10%
  - Medium ROI: No adjustment
- 🔄 **Scheduled Cron Jobs**: Runs bid adjustments every 4 hours
- 📝 **Audit Logging**: Tracks all bid adjustments with detailed logs
- 🗄️ **MongoDB Integration**: Stores campaign data and adjustment history
- 🔌 **Amazon API Integration**: Connects with Amazon Advertising API
- 🎯 **Configurable Thresholds**: Customize ROI thresholds and adjustment percentages

## Tech Stack

- **NestJS** - Progressive Node.js framework
- **MongoDB** - NoSQL database for campaign data
- **Mongoose** - MongoDB object modeling
- **@nestjs/schedule** - Cron job scheduler
- **Amazon Advertising API** - For bid management
- **TypeScript** - Type-safe development

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- Amazon Advertising API credentials

## Installation

1. **Install dependencies** (already done)
```bash
npm install
```

2. **Configure environment variables**

Edit `.env` file with your configurations:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/bid-manager

# Amazon SP-API Configuration
AMAZON_REGION=us-east-1
AMAZON_REFRESH_TOKEN=your_refresh_token
AMAZON_CLIENT_ID=your_client_id
AMAZON_CLIENT_SECRET=your_client_secret
AMAZON_MARKETPLACE_ID=ATVPDKIKX0DER

# Bid Adjustment Configuration
HIGH_ROI_THRESHOLD=3.0
LOW_ROI_THRESHOLD=1.0
BID_INCREASE_PERCENTAGE=15
BID_DECREASE_PERCENTAGE=10
MIN_BID_AMOUNT=0.25
MAX_BID_AMOUNT=10.00
```

3. **Start MongoDB**
```bash
# Using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Or using local MongoDB
mongod
```

4. **Seed sample data (optional)**
```bash
npm run seed
```

## Running the Application

### Development Mode
```bash
npm run start:dev
```

### Production Mode
```bash
npm run build
npm run start:prod
```

The application will start on `http://localhost:3000`

## API Endpoints

### Campaigns

**Get all campaigns**
```
GET /campaigns
```

**Get single campaign**
```
GET /campaigns/:id
```

**Create campaign**
```
POST /campaigns
Content-Type: application/json

{
  "campaignId": "camp_001",
  "campaignName": "Summer Sale",
  "adGroupId": "adg_001",
  "keyword": "wireless headphones",
  "currentBid": 2.50,
  "sales": 1500,
  "spend": 300,
  "clicks": 250,
  "impressions": 5000
}
```

**Sync campaigns from Amazon**
```
POST /campaigns/sync
```

**Manually trigger bid adjustment**
```
POST /campaigns/adjust-bids
```

**Get campaign adjustment logs**
```
GET /campaigns/:id/logs
```

**Get recent adjustment logs**
```
GET /campaigns/logs/recent
```

## Cron Jobs

### Bid Adjustment Job
- **Schedule**: Every 4 hours (`0 */4 * * *`)
- **Function**: Adjusts bids for all active campaigns based on ROI
- **Process**:
  1. Sync latest campaign data from Amazon
  2. Calculate ROI for each campaign
  3. Adjust bids based on ROI thresholds
  4. Update bids via Amazon API
  5. Log all adjustments

### Daily Sync Job
- **Schedule**: Daily at midnight (`0 0 * * *`)
- **Function**: Syncs campaign performance data from Amazon

## Database Schema

### Campaign Collection
```typescript
{
  campaignId: string;        // Unique campaign identifier
  campaignName: string;      // Campaign name
  adGroupId: string;         // Ad group identifier
  keyword: string;           // Target keyword
  currentBid: number;        // Current bid amount
  sales: number;             // Total sales
  spend: number;             // Total spend
  clicks: number;            // Total clicks
  impressions: number;       // Total impressions
  roi: number;               // Calculated ROI
  lastAdjustedAt: Date;      // Last bid adjustment timestamp
  status: string;            // Campaign status (active/paused)
  createdAt: Date;           // Creation timestamp
  updatedAt: Date;           // Last update timestamp
}
```

### BidAdjustmentLog Collection
```typescript
{
  campaignId: string;           // Campaign identifier
  keyword: string;              // Keyword
  oldBid: number;               // Previous bid
  newBid: number;               // New bid
  roi: number;                  // ROI at adjustment time
  reason: string;               // Adjustment reason
  adjustmentPercentage: number; // Percentage changed
  status: string;               // success/failed
  errorMessage: string;         // Error details if failed
  createdAt: Date;              // Adjustment timestamp
}
```

## Bid Adjustment Logic

```typescript
ROI = Sales / Spend

if (ROI >= HIGH_ROI_THRESHOLD) {
  newBid = currentBid * (1 + BID_INCREASE_PERCENTAGE / 100)
} else if (ROI <= LOW_ROI_THRESHOLD) {
  newBid = currentBid * (1 - BID_DECREASE_PERCENTAGE / 100)
} else {
  newBid = currentBid // No change
}

// Apply min/max constraints
newBid = Math.max(MIN_BID_AMOUNT, Math.min(MAX_BID_AMOUNT, newBid))
```

## Amazon API Integration

### Required API Credentials

1. **Amazon Advertising API Access**
   - Register as an Amazon Advertising API developer
   - Create an application to get Client ID and Client Secret
   - Generate refresh token through OAuth2 flow

2. **API Endpoints Used**
   - Campaign metrics retrieval
   - Keyword bid updates
   - Performance reports

### Important Notes

- The current implementation includes placeholder methods for Amazon API calls
- You need to implement OAuth2 token refresh mechanism
- Amazon Advertising API is separate from Amazon SP-API
- Ensure proper rate limiting and error handling

## Configuration Options

| Variable | Description | Default |
|----------|-------------|----------|
| `HIGH_ROI_THRESHOLD` | ROI threshold for bid increase | 3.0 |
| `LOW_ROI_THRESHOLD` | ROI threshold for bid decrease | 1.0 |
| `BID_INCREASE_PERCENTAGE` | Percentage to increase bid | 15 |
| `BID_DECREASE_PERCENTAGE` | Percentage to decrease bid | 10 |
| `MIN_BID_AMOUNT` | Minimum allowed bid | 0.25 |
| `MAX_BID_AMOUNT` | Maximum allowed bid | 10.00 |

## Project Structure

```
src/
├── controllers/
│   └── campaign.controller.ts    # REST API endpoints
├── schemas/
│   ├── campaign.schema.ts        # Campaign MongoDB schema
│   └── bid-adjustment-log.schema.ts  # Log schema
├── services/
│   ├── amazon-api.service.ts     # Amazon API integration
│   ├── bid-adjustment.service.ts # Bid adjustment logic
│   └── cron.service.ts          # Scheduled jobs
├── scripts/
│   └── seed-data.ts             # Database seeder
├── app.module.ts                # Main application module
└── main.ts                      # Application entry point
```

## Testing the Application

1. **Start the application**
```bash
npm run start:dev
```

2. **Seed sample data**
```bash
npm run seed
```

3. **Test API endpoints**
```bash
# Get all campaigns
curl http://localhost:3000/campaigns

# Manually trigger bid adjustment
curl -X POST http://localhost:3000/campaigns/adjust-bids

# View adjustment logs
curl http://localhost:3000/campaigns/logs/recent
```

## Monitoring & Logs

The application logs all important events:

- Bid adjustments (successful and failed)
- Amazon API calls
- Cron job executions
- Database operations

Logs include:
- Timestamp
- Log level (LOG, ERROR, WARN)
- Context (service name)
- Message details

## Troubleshooting

### MongoDB Connection Issues
```bash
# Check MongoDB is running
mongosh

# Verify connection string in .env
MONGODB_URI=mongodb://localhost:27017/bid-manager
```

### Amazon API Authentication
- Ensure refresh token is valid
- Check client ID and secret are correct
- Verify API permissions are granted
- Implement token refresh mechanism

### Cron Jobs Not Running
- Check application is running in background
- Verify timezone settings
- Check logs for errors

## License

UNLICENSED
