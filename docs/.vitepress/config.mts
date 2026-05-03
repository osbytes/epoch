import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Epoch',
  description:
    'Draft-aware, end-to-end typed multi-step form flows for React + tRPC + Zod.',
  base: '/epoch/',
  lastUpdated: true,
  cleanUrls: true,
  srcExclude: ['README.md'],
  themeConfig: {
    logo: '/logo.svg',
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/getting-started' },
      { text: 'API', link: '/api-reference' },
      { text: 'Examples', link: '/examples' },
    ],
    sidebar: {
      '/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Introduction', link: '/' },
            { text: 'Installation', link: '/getting-started' },
          ],
        },
        {
          text: 'Reference',
          items: [
            { text: 'API Reference', link: '/api-reference' },
            { text: 'Architecture', link: '/architecture' },
            { text: 'Examples', link: '/examples' },
          ],
        },
        {
          text: 'Meta',
          items: [{ text: 'Contributing', link: '/contributing' }],
        },
      ],
    },
    socialLinks: [{ icon: 'github', link: 'https://github.com/osbytes/epoch' }],
    editLink: {
      pattern: 'https://github.com/osbytes/epoch/edit/main/docs/:path',
      text: 'Edit this page on GitHub',
    },
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © Epoch Contributors',
    },
  },
})
