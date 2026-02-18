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
        text: 'SRS',
        items: [
          { text: 'ACOS & ROAS Rules', link: '/acos-roas-diagram' },
        ],
      },
      {
        text: 'Guides',
        items: [
          { text: 'Quick Start', link: '/QUICKSTART' },
          { text: 'Amazon API Setup', link: '/AMAZON_API_SETUP' },
        ],
      },
    ],
  },

  mermaid: {},
});
