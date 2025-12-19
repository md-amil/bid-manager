import * as mongoose from 'mongoose';
import { Campaign, CampaignSchema } from '../schemas/campaign.schema';

async function seedData() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/bid-manager');
    console.log('Connected to MongoDB');

    // Get Campaign model
    const CampaignModel = mongoose.model('Campaign', CampaignSchema);

    // Clear existing data
    await CampaignModel.deleteMany({});
    console.log('Cleared existing campaigns');

    // Sample campaign data
    const sampleCampaigns = [
      {
        campaignId: 'camp_001',
        campaignName: 'Summer Sale Campaign',
        adGroupId: 'adg_001',
        keyword: 'wireless headphones',
        currentBid: 2.50,
        sales: 1500,
        spend: 300,
        clicks: 250,
        impressions: 5000,
        status: 'active',
      },
      {
        campaignId: 'camp_002',
        campaignName: 'Electronics Promo',
        adGroupId: 'adg_002',
        keyword: 'bluetooth speaker',
        currentBid: 1.75,
        sales: 800,
        spend: 400,
        clicks: 180,
        impressions: 3500,
        status: 'active',
      },
      {
        campaignId: 'camp_003',
        campaignName: 'Tech Accessories',
        adGroupId: 'adg_003',
        keyword: 'phone case',
        currentBid: 1.20,
        sales: 250,
        spend: 300,
        clicks: 320,
        impressions: 4200,
        status: 'active',
      },
      {
        campaignId: 'camp_004',
        campaignName: 'Gaming Products',
        adGroupId: 'adg_004',
        keyword: 'gaming mouse',
        currentBid: 3.00,
        sales: 2400,
        spend: 600,
        clicks: 400,
        impressions: 6000,
        status: 'active',
      },
      {
        campaignId: 'camp_005',
        campaignName: 'Office Supplies',
        adGroupId: 'adg_005',
        keyword: 'ergonomic keyboard',
        currentBid: 2.20,
        sales: 500,
        spend: 550,
        clicks: 280,
        impressions: 4500,
        status: 'active',
      },
    ];

    // Insert sample data
    await CampaignModel.insertMany(sampleCampaigns);
    console.log('Inserted sample campaigns');
    console.log(`Total campaigns inserted: ${sampleCampaigns.length}`);

    // Display sample data with calculated ROI
    console.log('\n--- Sample Campaigns ---');
    sampleCampaigns.forEach((campaign) => {
      const roi = campaign.sales / campaign.spend;
      console.log(`\nCampaign: ${campaign.campaignName}`);
      console.log(`Keyword: ${campaign.keyword}`);
      console.log(`Current Bid: $${campaign.currentBid}`);
      console.log(`Sales: $${campaign.sales}`);
      console.log(`Spend: $${campaign.spend}`);
      console.log(`ROI: ${roi.toFixed(2)}`);
      console.log(`Status: ${roi >= 3.0 ? 'High ROI - Will Increase Bid' : roi <= 1.0 ? 'Low ROI - Will Decrease Bid' : 'Normal - No Change'}`);
    });

    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seedData();
