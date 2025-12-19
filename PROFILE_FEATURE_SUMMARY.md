# Amazon Advertising Profiles Feature

## 🎯 Overview
Added complete profile management functionality to fetch and display Amazon Advertising API profiles using the `/v2/profiles` endpoint.

## ✅ What's Been Implemented

### 1. Backend Service Methods
**File:** `src/services/amazon-api.service.ts`

- `getProfiles()` - Fetches all available profiles
- `getProfile(profileId)` - Fetches specific profile details
- `AmazonProfile` interface - TypeScript interface for profile data

### 2. Profile Controller
**File:** `src/controllers/profile.controller.ts`

**Routes:**
- `GET /profiles` - Profile listing page (HTML)
- `GET /profiles/api` - Profile listing (JSON API)
- `GET /profiles/api/:id` - Specific profile (JSON API)  
- `GET /profiles/:id` - Profile detail page (HTML)

### 3. Profile Views
**Files:** `views/profiles.ejs`, `views/profile-detail.ejs`

**Features:**
- Responsive grid layout for profile cards
- Profile type badges (Seller, Vendor, Agency)
- Copy-to-clipboard functionality for IDs
- Quick action buttons
- API connection testing
- Real-time refresh capabilities

### 4. Navigation Integration
- Added "Profiles" link to main navigation
- Added Font Awesome icons for better UI
- Breadcrumb navigation on detail pages

## 🚀 How to Use

### 1. Access Profiles
```
http://localhost:3000/profiles
```

### 2. API Endpoints
```bash
# Get all profiles
curl http://localhost:3000/profiles/api

# Get specific profile
curl http://localhost:3000/profiles/api/1234567890
```

### 3. Profile Information Displayed
- **Basic Info:** Profile ID, Account ID, Marketplace ID
- **Regional:** Country, Currency, Timezone
- **Budget:** Daily budget (if available)
- **Account Type:** Seller, Vendor, or Agency
- **Payment Status:** Verification status

## 🔧 Features

### Profile Cards
- Visual icons based on account type
- Color-coded badges
- Hover effects and animations
- Responsive design

### Profile Details
- Copy-to-clipboard for all IDs
- API connection testing
- Quick navigation to campaigns
- Real-time data refresh

### Error Handling
- Graceful fallbacks for API failures
- User-friendly error messages
- Retry mechanisms

## 🧪 Testing

### Manual Testing
1. Start your application: `npm run start:dev`
2. Navigate to: `http://localhost:3000/profiles`
3. Click on profile cards to view details

### API Testing
Run the test script:
```bash
node test-profile-api.js
```

### Expected Behavior
- ✅ Profiles load from Amazon API
- ✅ Profile details display correctly
- ✅ Copy functionality works
- ✅ API connection test passes
- ✅ Navigation works smoothly

## 📋 Prerequisites

### Environment Variables Required
```env
AMAZON_CLIENT_ID=your_client_id
AMAZON_CLIENT_SECRET=your_client_secret
AMAZON_REFRESH_TOKEN=your_refresh_token
AMAZON_PROFILE_ID=your_profile_id
```

### Amazon API Setup
1. Follow `QUICKSTART_AMAZON_API.md` for setup
2. Run `npm run get-token` to get credentials
3. Update your `.env` file

## 🎨 UI Components

### Profile Card
- Account type icon
- Profile name and type badge
- Key metrics (country, currency, timezone)
- Action buttons (View Details, View Campaigns)

### Profile Detail Page
- Comprehensive profile information
- Copy-to-clipboard functionality
- Quick action grid
- API connectivity testing

## 🔗 Integration Points

### With Existing Features
- Links to campaign management
- Integration with bid adjustment system
- Connects to performance reporting

### Future Enhancements
- Profile switching functionality
- Multi-profile campaign management
- Profile-specific settings

## 📱 Responsive Design
- Mobile-friendly layouts
- Touch-optimized interactions
- Adaptive grid systems
- Collapsible sections on small screens

## 🛡️ Error Handling
- API timeout handling
- Invalid profile ID handling
- Network error recovery
- User-friendly error messages

## 🚀 Next Steps
1. Test with your Amazon API credentials
2. Verify profile data loads correctly
3. Use profile IDs for campaign filtering
4. Integrate with existing bid management workflows

The profile feature is now fully integrated and ready to use with your Amazon Advertising API setup!