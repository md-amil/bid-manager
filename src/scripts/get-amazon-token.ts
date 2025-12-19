/**
 * Helper script to obtain Amazon Advertising API refresh token
 * 
 * Usage:
 * 1. Set your AMAZON_CLIENT_ID and AMAZON_CLIENT_SECRET in .env
 * 2. Run: npm run get-token
 * 3. Follow the instructions in the console
 */

import * as dotenv from 'dotenv';
import axios from 'axios';
import * as readline from 'readline';

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function getRefreshToken() {
  console.log('\n=== Amazon Advertising API Token Setup ===\n');

  const clientId = process.env.AMAZON_CLIENT_ID;
  const clientSecret = process.env.AMAZON_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error('❌ Error: AMAZON_CLIENT_ID and AMAZON_CLIENT_SECRET must be set in .env file');
    process.exit(1);
  }

  const redirectUri = 'http://localhost:3000/callback';
  // const scope = 'advertising::campaign_management';
  const scope = 'advertising::test:create_account%20advertising::campaign_management'

  // Step 1: Generate authorization URL
  const authUrl = `https://www.amazon.com/ap/oa?client_id=${clientId}&scope=${scope}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}`;

  console.log('Step 1: Authorization URL');
  console.log('------------------------');
  console.log('Open this URL in your browser:\n');
  console.log(authUrl);
  console.log('\n');

  // Step 2: Get authorization code
  const authCode = await question('Step 2: After authorizing, paste the authorization code from the redirect URL: ');

  if (!authCode.trim()) {
    console.error('❌ Error: Authorization code is required');
    rl.close();
    process.exit(1);
  }

  console.log('\nExchanging authorization code for tokens...\n');

  try {
    // Step 3: Exchange code for tokens
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code: authCode.trim(),
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
    });

    const response = await axios.post(
      'https://api.amazon.com/auth/o2/token',
      params.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const { access_token, refresh_token, expires_in } = response.data;

    console.log('✅ Success! Tokens obtained:\n');
    console.log('Access Token (expires in 1 hour):');
    console.log(access_token);
    console.log('\n');
    console.log('Refresh Token (save this in your .env file):');
    console.log(refresh_token);
    console.log('\n');

    // Step 4: Get Profile ID
    console.log('Fetching your profile ID...\n');

    try {
      const profilesResponse = await axios.get(
        'https://advertising-api.amazon.com/v2/profiles',
        {
          headers: {
            'Authorization': `Bearer ${access_token}`,
            'Amazon-Advertising-API-ClientId': clientId,
          },
        }
      );

      console.log('✅ Available Profiles:\n');
      profilesResponse.data.forEach((profile: any, index: number) => {
        console.log(`Profile ${index + 1}:`);
        console.log(`  Profile ID: ${profile.profileId}`);
        console.log(`  Country: ${profile.countryCode}`);
        console.log(`  Currency: ${profile.currencyCode}`);
        console.log(`  Account Type: ${profile.accountInfo?.type || 'N/A'}`);
        console.log(`  Account Name: ${profile.accountInfo?.name || 'N/A'}`);
        console.log('');
      });

      if (profilesResponse.data.length > 0) {
        const defaultProfile = profilesResponse.data[0];
        console.log('\n=== Add these to your .env file ===\n');
        console.log(`AMAZON_REFRESH_TOKEN=${refresh_token}`);
        console.log(`AMAZON_PROFILE_ID=${defaultProfile.profileId}`);
        console.log(`AMAZON_MARKETPLACE_ID=${defaultProfile.accountInfo?.marketplaceStringId || 'ATVPDKIKX0DER'}`);
        console.log('\n');
      }
    } catch (profileError) {
      console.error('⚠️  Could not fetch profiles:', profileError.response?.data || profileError.message);
      console.log('\nYou can manually get your profile ID later using the access token.');
      console.log('\n=== Add this to your .env file ===\n');
      console.log(`AMAZON_REFRESH_TOKEN=${refresh_token}`);
      console.log('\n');
    }

  } catch (error) {
    console.error('❌ Error exchanging authorization code:', error.response?.data || error.message);
    console.log('\nCommon issues:');
    console.log('- Authorization code expired (valid for 5 minutes)');
    console.log('- Invalid client credentials');
    console.log('- Redirect URI mismatch');
    process.exit(1);
  }

  rl.close();
}

getRefreshToken().catch((error) => {
  console.error('Unexpected error:', error);
  rl.close();
  process.exit(1);
});
