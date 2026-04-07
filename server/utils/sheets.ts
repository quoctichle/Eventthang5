// Utility: gửi dữ liệu lên Google Sheets qua Apps Script webhook
// Không throw lỗi để không ảnh hưởng đến luồng chính nếu Sheets tạm thời unavailable

export function getSheetsWebhookUrl(event: any): string {
  // Cloudflare Pages: đọc trực tiếp từ CF env (không qua process.env)
  return event.context.cloudflare?.env?.SHEETS_WEBHOOK_URL
    || event.context.cloudflare?.env?.NUXT_SHEETS_WEBHOOK_URL
    || useRuntimeConfig(event).sheetsWebhookUrl
    || ''
}

export async function sheetsAddCodes(webhookUrl: string, codes: string[]): Promise<void> {
  if (!webhookUrl) return
  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' }, // Apps Script yêu cầu text/plain để tránh CORS preflight
      body: JSON.stringify({ action: 'add_codes', codes })
    })
  } catch (e) {
    console.error('[Sheets] Failed to sync new codes:', e)
  }
}

export async function sheetsUpdateSpin(webhookUrl: string, code: string, prizeName: string): Promise<void> {
  if (!webhookUrl) return
  try {
    const spinTime = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: 'update_spin', code, prize_name: prizeName, spin_time: spinTime })
    })
  } catch (e) {
    console.error('[Sheets] Failed to update spin result:', e)
  }
}
