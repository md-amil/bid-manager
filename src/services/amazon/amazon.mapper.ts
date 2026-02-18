export class AmazonMapper {
  static campaign(c: any, scopeId: string) {
    return {
      ...c,
      scopeId,
    };
  }

  static adGroup(g: any, scopeId: string) {
    return {
      scopeId,
      amazonAdGroupId: g.adGroupId,
      campaignId: g.campaignId,
      name: g.name,
      state: g.state,
      defaultBid: g.defaultBid,
      rawAmazonData: g,
    };
  }

  static ad(a: any, scopeId: string) {
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

  static keyword(a: any, scopeId: string, type: -1 | 1 = 1) {
    return {
      type,
      scopeId,
      ...a,
    };
  }
  static target(a: any, scopeId: string, type: -1 | 1 = 1) {
    return {
      type,
      scopeId,
      ...a,
    };
  }

  static profile(p: any, organisationId: string) {
    return {
      organisationId,
      ...p,
    };
  }

  static reportFromCampaign(matrics: any) {
    return {};
  }

  static reportFromAdgroup(matrics: any) {
    return {};
  }

  static reportFromKeyword(matrics: any) {
    return {};
  }
}
