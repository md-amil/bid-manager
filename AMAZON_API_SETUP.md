# Amazon Advertising API Setup Guide

## Overview
This guide will walk you through setting up Amazon Advertising API integration, including OAuth2 authentication and obtaining your refresh token.

## Prerequisites
- An Amazon Seller Central or Amazon Vendor Central account
- Access to Amazon Advertising Console
- A registered application in Amazon Developer Console

## Step 1: Register Your Application

1. Go to [Amazon Developer Console](https://developer.amazon.com/)
2. Sign in with your Amazon account
3. Navigate to **Login with Amazon** → **Create a New Security Profile**
4. Fill in the required information:
   - **Security Profile Name**: Your app name (e.g., "Bid Manager")
   - **Security Profile Description**: Brief description
   - **Consent Privacy Notice URL**: Your privacy policy URL
   - **Consent Logo Image**: Optional logo

5. After creating, click **Show Client ID and Client Secret**
6. Save these credentials:
   - `Client ID` → `AMAZON_CLIENT_ID`
   - `Client Secret` → `AMAZON_CLIENT_SECRET`

## Step 2: Configure OAuth Settings

1. In your Security Profile, click **Web Settings** → **Edit**
2. Add **Allowed Return URLs**:
   ```
   http://localhost:3000/callback
   https://yourdomain.com/callback
   ```
3. Save the settings

## Step 3: Get Authorization Code

1. Build the authorization URL with your Client ID:
   ```
   https://www.amazon.com/ap/oa?client_id=YOUR_CLIENT_ID&scope=advertising::campaign_management&response_type=code&redirect_uri=http://localhost:3000/callback
   ```

2. Replace `YOUR_CLIENT_ID` with your actual Client ID

3. Open this URL in your browser

4. Sign in with your Amazon Advertising account

5. Grant permissions to your application

6. You'll be redirected to your callback URL with an authorization code:
   ```
   http://localhost:3000/callback?code=AUTHORIZATION_CODE&scope=advertising::campaign_management
   ```

7. Copy the `AUTHORIZATION_CODE` from the URL

## Step 4: Exchange Authorization Code for Refresh Token

Use this curl command to get your refresh token:

```bash
curl -X POST \
  https://api.amazon.com/auth/o2/token \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'grant_type=authorization_code' \
  -d 'code=YOUR_AUTHORIZATION_CODE' \
  -d 'client_id=YOUR_CLIENT_ID' \
  -d 'client_secret=YOUR_CLIENT_SECRET' \
  -d 'redirect_uri=http://localhost:3000/callback'
```

Replace:
- `YOUR_AUTHORIZATION_CODE` with the code from Step 3
- `YOUR_CLIENT_ID` with your Client ID
- `YOUR_CLIENT_SECRET` with your Client Secret

Response will look like:
```json
{
  "access_token": "Atza|...",
  "refresh_token": "Atzr|...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

**Save the `refresh_token`** → This is your `AMAZON_REFRESH_TOKEN`

## Step 5: Get Your Profile ID

1. Use the access token from Step 4 to get your profiles:

```bash
curl -X GET \
  https://advertising-api.amazon.com/v2/profiles \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
  -H 'Amazon-Advertising-API-ClientId: YOUR_CLIENT_ID'
```

Response:
```json
[
  {
    "profileId": 1234567890,
    "countryCode": "US",
    "currencyCode": "USD",
    "dailyBudget": 100.0,
    "timezone": "America/Los_Angeles",
    "accountInfo": {
      "marketplaceStringId": "ATVPDKIKX0DER",
      "id": "A1234567890ABC",
      "type": "seller",
      "name": "Your Store Name"
    }
  }
]
```

**Save the `profileId`** → This is your `AMAZON_PROFILE_ID`

## Step 6: Configure Environment Variables

Update your `.env` file with all the credentials:

```env
# Amazon Advertising API Configuration
AMAZON_CLIENT_ID=amzn1.application-oa2-client.xxxxx
AMAZON_CLIENT_SECRET=xxxxx
AMAZON_REFRESH_TOKEN=Atzr|xxxxx
AMAZON_PROFILE_ID=1234567890
AMAZON_MARKETPLACE_ID=ATVPDKIKX0DER

# API Endpoints (usually don't need to change)
AMAZON_TOKEN_URL=https://api.amazon.com/auth/o2/token
AMAZON_ADVERTISING_API_URL=https://advertising-api.amazon.com
```

## Step 7: Test Your Integration

Run your application and check the logs:

```bash
npm run start:dev
```

You should see:
```
[AmazonApiService] Access token refreshed successfully
[AmazonApiService] Amazon Advertising API client initialized
```

## Important Notes

### Refresh Token
- **Never expires** unless revoked by the user
- Store it securely (use environment variables, never commit to git)
- The application will automatically refresh the access token when needed

### Access Token
- Expires after 1 hour
- Automatically refreshed by the service
- Don't need to manually manage it

### Rate Limits
Amazon Advertising API has rate limits:
- Most endpoints: 1 request per second
- Some endpoints: Higher limits
- Implement retry logic with exponential backoff

### Scopes
Common scopes for advertising:
- `advertising::campaign_management` - Manage campaigns, ad groups, keywords, bids

### Regions
Different regions have different endpoints:
- **North America**: `https://advertising-api.amazon.com`
- **Europe**: `https://advertising-api-eu.amazon.com`
- **Far East**: `https://advertising-api-fe.amazon.com`

Update `AMAZON_ADVERTISING_API_URL` based on your region.

## Troubleshooting

### "Invalid client" error
- Double-check your Client ID and Client Secret
- Ensure they match the Security Profile

### "Invalid grant" error
- Authorization code expired (valid for 5 minutes)
- Get a new authorization code and try again

### "Invalid scope" error
- Ensure your account has access to Amazon Advertising
- Check that you're using the correct scope

### "Access denied" error
- Verify your refresh token is correct
- Check that your Security Profile has the right permissions

## Testing API Calls

Once configured, you can test with:

```typescript
// Get campaign metrics
const metrics = await amazonApiService.getCampaignMetrics(
  'campaignId',
  '2024-01-01',
  '2024-01-31'
);

// Get keyword bids
const keywords = await amazonApiService.getKeywordBids('campaignId');

// Update keyword bid
await amazonApiService.updateKeywordBid('keywordId', 1.50);
```

## Security Best Practices

1. **Never commit credentials** to version control
2. **Use environment variables** for all sensitive data
3. **Rotate credentials** periodically
4. **Monitor API usage** for unusual activity
5. **Implement proper error handling** and logging
6. **Use HTTPS** for all API calls
7. **Store refresh tokens encrypted** in production

## Additional Resources

- [Amazon Advertising API Documentation](https://advertising.amazon.com/API/docs)
- [Login with Amazon Documentation](https://developer.amazon.com/docs/login-with-amazon/documentation-overview.html)
- [OAuth 2.0 Authorization Code Grant](https://developer.amazon.com/docs/login-with-amazon/authorization-code-grant.html)
