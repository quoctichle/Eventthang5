// GET /api/admin/test-sheets - Test kết nối Google Sheets webhook
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const session = await useSession(event, { password: config.sessionSecret })
  if (!session.data?.admin) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const webhookUrl = (config.sheetsWebhookUrl || (event.context.cloudflare?.env as any)?.SHEETS_WEBHOOK_URL) as string

  if (!webhookUrl) {
    return { ok: false, error: 'SHEETS_WEBHOOK_URL chưa được cấu hình', webhookUrl: null }
  }

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({
        action: 'add_codes',
        codes: ['TEST-CODE-' + Date.now()]
      })
    })
    const text = await res.text()
    return { ok: res.ok, status: res.status, response: text, webhookUrl: webhookUrl.slice(0, 60) + '...' }
  } catch (e: any) {
    return { ok: false, error: e.message, webhookUrl: webhookUrl.slice(0, 60) + '...' }
  }
})
