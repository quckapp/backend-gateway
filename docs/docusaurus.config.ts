import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'QuckApp Documentation',
  tagline: 'Real-time messaging platform with audio/video calling',
  favicon: 'img/favicon.ico',

  url: 'https://quckapp.com',
  baseUrl: '/',

  organizationName: 'quckapp',
  projectName: 'quckapp-docs',

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/quckapp/backend/tree/main/docs/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/quckapp-social-card.jpg',
    navbar: {
      title: 'QuckApp',
      logo: {
        alt: 'QuckApp Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Documentation',
        },
        {
          to: '/docs/category/api-reference',
          label: 'API Reference',
          position: 'left',
        },
        {
          href: 'https://github.com/quckapp/backend',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            { label: 'Getting Started', to: '/docs/getting-started/quick-start' },
            { label: 'Architecture', to: '/docs/architecture/overview' },
            { label: 'API Reference', to: '/docs/category/api-reference' },
          ],
        },
        {
          title: 'Resources',
          items: [
            { label: 'OpenAPI Spec', to: '/docs/api-reference/openapi' },
            { label: 'Postman Collection', to: '/docs/api-reference/postman' },
            { label: 'Environments', to: '/docs/deployment/environments' },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} QuckApp. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'json', 'yaml', 'typescript'],
    },
    colorMode: {
      defaultMode: 'light',
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
