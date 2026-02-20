import { Campaign } from 'src/schemas/campaign.schema';
import { Keyword } from 'src/schemas/keyword.schema';
import { KeywordReport } from 'src/schemas/reports/keyword-report.schema';
import { CampaignReport } from 'src/schemas/reports/report.schema';

export interface keywordWithReport extends Keyword {
  keywordReports: KeywordReport;
}

export interface ICampaignBundle extends Campaign {
  campaignReport: CampaignReport;
  keywords: keywordWithReport[];
}
