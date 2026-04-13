// Utility: gửi dữ liệu lên Google Sheets qua Apps Script webhook
// Không throw lỗi để không ảnh hưởng đến luồng chính nếu Sheets tạm thời unavailable

async function postSheetsWebhook(webhookUrl: string, payload: Record<string, any>): Promise<void> {
  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' }, // Apps Script yêu cầu text/plain để tránh CORS preflight
    body: JSON.stringify(payload)
  })

  const text = await res.text()
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${text}`)
  }

  // Apps Script thường trả JSON dạng { success: boolean, ... }
  if (text) {
    try {
      const json = JSON.parse(text)
      if (json && typeof json === 'object' && json.success === false) {
        throw new Error(json.error || 'Apps Script returned success=false')
      }
    } catch {
      // Bỏ qua parse error: một số script trả plain text, chỉ cần HTTP OK là chấp nhận
    }
  }
}

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
    await postSheetsWebhook(webhookUrl, { action: 'add_codes', codes })
  } catch (e) {
    console.error('[Sheets] Failed to sync new codes:', e)
  }
}

export async function sheetsUpdateSpin(webhookUrl: string, code: string, prizeName: string): Promise<void> {
  if (!webhookUrl) return
  try {
    const spinTime = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
    await postSheetsWebhook(webhookUrl, { action: 'update_spin', code, prize_name: prizeName, spin_time: spinTime })
  } catch (e) {
    console.error('[Sheets] Failed to update spin result:', e)
  }
}

export async function sheetsDeleteCodes(webhookUrl: string, codes: string[]): Promise<void> {
  if (!webhookUrl || !codes.length) return
  try {
    await postSheetsWebhook(webhookUrl, { action: 'delete_codes', codes })
  } catch (e) {
    console.error('[Sheets] Failed to delete codes:', e)
  }
}
