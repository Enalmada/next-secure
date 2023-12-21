import prefetch from '@astrojs/prefetch';
import react from '@astrojs/react';
import starlight from '@astrojs/starlight';
import tailwind from '@astrojs/tailwind';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  integrations: [
    starlight({
      title: 'next-secure',
      defaultLocale: 'root', // optional
      locales: {
        root: {
          label: 'English',
          lang: 'en', // lang is required for root locales
        },
      },
      social: {
        github: 'https://github.com/Enalmada/next-secure',
      },
      sidebar: [
        {
          label: 'Getting Started',
          items: [
            {
              label: 'Getting Started',
              link: '/guides/getting-started/',
            },
          ],
        },
        {
          label: 'Technologies',
          items: [
            {
              label: 'Summary',
              link: '/technologies/summary/',
            },
          ],
        },
      ],
      customCss: ['./src/assets/landing.css', './src/tailwind.css'],
    }),
    react(),
    // applyBaseStyles causes lists to not work anymore
    tailwind({
      applyBaseStyles: false,
    }),
    prefetch(),
  ],
});
