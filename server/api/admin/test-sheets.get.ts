// GET /api/admin/test-sheets - Test kết nối Google Sheets webhook
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const session = await useSession(event, { password: config.sessionSecret })
  if (!session.data?.admin) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  // Debug: in ra tất cả env vars để xem CF có inject không
  const cfEnv = event.context.cloudflare?.env as any
  const allKeys = cfEnv ? Object.keys(cfEnv) : []

  const webhookUrl = cfEnv?.SHEETS_WEBHOOK_URL || cfEnv?.NUXT_SHEETS_WEBHOOK_URL || config.sheetsWebhookUrl || ''

  if (!webhookUrl) {
    return {
      ok: false,
      error: 'SHEETS_WEBHOOK_URL chưa được cấu hình',
      webhookUrl: null,
      cfEnvKeys: allKeys, // Hiển thị danh sách env keys để debug
      runtimeConfigUrl: config.sheetsWebhookUrl ? 'CÓ (qua runtimeConfig)' : 'KHÔNG'
    }
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
