// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  app: {
    head: {
      viewport: 'width=device-width, initial-scale=1, viewport-fit=cover',
    }
  },
  runtimeConfig: {
    adminEmail: 'admin@sunshine.com',
    adminPassword: 'sunshinetelecom',
    sessionSecret: 'sunshine-telecom-session-secret-key-2026!!',
    sheetsWebhookUrl: '', // Set via NUXT_SHEETS_WEBHOOK_URL env var or Cloudflare env SHEETS_WEBHOOK_URL
  },
  nitro: {
    preset: 'cloudflare-pages',
  },
  vite: {
    optimizeDeps: {
      include: [
        '@vue/devtools-core',
        '@vue/devtools-kit',
      ]
    }
  }
})
