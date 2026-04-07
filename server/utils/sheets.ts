// Utility: gửi dữ liệu lên Google Sheets qua Apps Script webhook
// Không throw lỗi để không ảnh hưởng đến luồng chính nếu Sheets tạm thời unavailable

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
