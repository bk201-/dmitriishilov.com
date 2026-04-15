// @ts-check
import { defineConfig } from 'astro/config';
// https://astro.build/config
export default defineConfig({
  output: 'static',
  site: 'https://dmitriishilov.com',
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'ru'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
});
