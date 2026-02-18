import { withMermaid } from 'vitepress-plugin-mermaid';

export default withMermaid({
  srcDir: './docs',
  title: 'Bid Manager Docs',
  description: 'Amazon Ads Bid Manager – Internal Documentation',
  base: '/',

  themeConfig: {
    nav: [{ text: 'Home', link: '/' }],

    sidebar: [
      {
        text: 'SRS – Rules & Formulas',
        items: [
          { text: 'ACOS & ROAS',              link: '/acos-roas-diagram' },
          { text: 'Ad Budget Rules',           link: '/budget-rules-diagram' },
          { text: 'Auto Campaign Adjustments', link: '/auto-campaign-diagram' },
          { text: 'Bidding Adjustments',       link: '/bidding-rules-diagram' },
          { text: 'Date-Wise Monitoring',      link: '/monitoring-diagram' },
          { text: 'Keyword Targeting',         link: '/keyword-targeting-diagram' },
        ],
      },
      {
        text: 'Guides',
        items: [
          { text: 'Quick Start', link: '/quickstart' },
          { text: 'Amazon API Quick Start', link: '/quickstart-amazon-api' },
          { text: 'Amazon API Setup', link: '/amazon-api-setup' },
          { text: 'Optimization Log Integration', link: '/optimization-log-integration' },
        ],
      },
    ],
  },

  mermaid: {},
});
