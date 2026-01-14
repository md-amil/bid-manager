export class AmazonMapper {
  static campaign(c: any,scopeId: string) {
    return {
      ...c,
      scopeId,
      // startDate: c.startDate,
      // campaignId: c.campaignId,
      // name: c.name,
      // state: c.state,
      // budget: c.budget,
      // marketplace: c.marketplaceId,
      // rawAmazonData: c,
    };
  }

            
  static adGroup(g: any, scopeId:string,) {
    return {
      scopeId,
      amazonAdGroupId: g.adGroupId,
      campaignId:g.campaignId,
      name: g.name,
      state: g.state,
      defaultBid: g.defaultBid,
      rawAmazonData: g,
    };
  }

  static ad(a: any,scopeId:string,) {
    return {
      scopeId,
      amazonAdId: a.adId,
      campaignId: a.campaignId,
      adGroupId: a.adGroupId,
      asin: a.asin,
      status: a.state,
      rawAmazonData: a,
    };
  }

  static keyword(a: any, campaignId: any, adGroupId: any,scopeId:string,) {
    return {
      scopeId,
      amazonAdId: a.adId,
      campaignId,
      adGroupId,
      asin: a.asin,
      status: a.state,
      rawAmazonData: a,
    };
  }

  static profile(p: any) { 
    return {
      profileId: p.profileId,
      sellerName: p.sellerName,
      marketplaceId: p.marketplaceId,
    };
  }
}
