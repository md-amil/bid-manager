export default () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',

  session: {
    secret:
      process.env.SESSION_SECRET ?? 'bid-manager-secret-change-in-production',
    ttlSeconds: 24 * 60 * 60,
  },

  mongodb: {
    uri: process.env.MONGODB_URI ?? 'mongodb://localhost:27017/bid-manager',
  },

  redis: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
  },

  amazon: {
    clientId: process.env.AMAZON_CLIENT_ID ?? '',
    clientSecret: process.env.AMAZON_CLIENT_SECRET ?? '',
    redirectUri: process.env.AMAZON_REDIRECT_URI ?? '',
    profileId: process.env.AMAZON_PROFILE_ID ?? '',
    refreshToken: process.env.AMAZON_REFRESH_TOKEN ?? '',
    apiUrl:
      process.env.AMAZON_ADVERTISING_API_URL ??
      'https://advertising-api-eu.amazon.com',
    tokenUrl:
      process.env.AMAZON_TOKEN_URL ??
      'https://api.amazon.com/auth/o2/token',
  },

  optimization: {
    targetAcos: parseFloat(process.env.TARGET_ACOS ?? '0.30'),
    minBid: parseFloat(process.env.MIN_BID_AMOUNT ?? '0.25'),
    maxBid: parseFloat(process.env.MAX_BID_AMOUNT ?? '10.00'),
    bidIncreasePct: parseFloat(process.env.BID_INCREASE_PERCENTAGE ?? '15'),
    bidDecreasePct: parseFloat(process.env.BID_DECREASE_PERCENTAGE ?? '10'),
    minSampleClicks: parseInt(process.env.MIN_SAMPLE_CLICKS ?? '20', 10),
    minSampleSpend: parseFloat(process.env.MIN_SAMPLE_SPEND ?? '200'),
  },
});
