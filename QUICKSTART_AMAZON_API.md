# Quick Start: Amazon Advertising API Integration

## 🚀 Fast Setup (5 minutes)

### 1. Register Your App
Go to [Amazon Developer Console](https://developer.amazon.com/) and create a Security Profile:
- Save your **Client ID** and **Client Secret**

### 2. Configure OAuth Redirect
In your Security Profile settings:
- Add redirect URL: `http://localhost:3000/callback`

### 3. Set Environment Variables
Add to your `.env` file:
```env
AMAZON_CLIENT_ID=your_client_id_here
AMAZON_CLIENT_SECRET=your_client_secret_here
```

### 4. Get Your Refresh Token
Run the helper script:
```bash
npm run get-token
```

Follow the prompts:
1. Open the authorization URL in your browser
2. Sign in and authorize the app
3. Copy the code from the redirect URL
4. Paste it into the terminal

The script will automatically:
- Exchange the code for a refresh token
- Fetch your profile ID
- Display the values to add to your `.env` file

### 5. Update .env File
Add the values from step 4:
```env
AMAZON_REFRESH_TOKEN=Atzr|xxxxx
AMAZON_PROFILE_ID=1234567890
```

### 6. Start Your App
```bash
npm run start:dev
```

You should see:
```
[AmazonApiService] Access token refreshed successfully
[AmazonApiService] Amazon Advertising API client initialized
```

## ✅ You're Done!

The service will automatically:
- Refresh access tokens when they expire
- Handle authentication for all API calls
- Manage token lifecycle

## 📖 Available Methods

```typescript
// Get campaign metrics
await amazonApiService.getCampaignMetrics(campaignId, startDate, endDate);

// Get keyword bids
await amazonApiService.getKeywordBids(campaignId);

// Update keyword bid
await amazonApiService.updateKeywordBid(keywordId, newBid);

// Get campaign performance report
await amazonApiService.getCampaignPerformanceReport(startDate, endDate);

// Get keyword performance
await amazonApiService.getKeywordPerformance(adGroupId, startDate, endDate);
```

## 🔧 Troubleshooting

**"Invalid client" error**
- Check your Client ID and Client Secret

**"Invalid grant" error**
- Authorization code expired, get a new one

**"Access denied" error**
- Verify your refresh token is correct

## 📚 Full Documentation
See `AMAZON_API_SETUP.md` for detailed information.
