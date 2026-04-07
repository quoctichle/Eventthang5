import { hashPassword, verifyPassword } from '~/server/utils/password'

const SUPER_ADMIN_EMAIL = 'SST-IT@sunshine.com'
const SUPER_ADMIN_PASSWORD = 'sunshinetelecom'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const body = await readBody(event)

  if (!body.email || !body.password) {
    throw createError({ statusCode: 400, message: 'Vui lòng nhập đầy đủ thông tin' })
  }

  const { DB } = event.context.cloudflare.env

  // Tự tạo bảng nếu chưa có
  await DB.prepare(`
    CREATE TABLE IF NOT EXISTS admin_accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      is_superadmin INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `).run()

  // Auto-seed super admin nếu bảng còn trống
  const count = await DB.prepare('SELECT COUNT(*) as c FROM admin_accounts').first<{ c: number }>()
  if ((count?.c ?? 0) === 0) {
    const hash = await hashPassword(SUPER_ADMIN_PASSWORD)
    await DB.prepare(
      'INSERT INTO admin_accounts (email, password_hash, is_superadmin) VALUES (?, ?, 1)'
    ).bind(SUPER_ADMIN_EMAIL, hash).run()
  }

  const account = await DB.prepare(
    'SELECT id, email, password_hash, is_superadmin FROM admin_accounts WHERE LOWER(email) = LOWER(?)'
  ).bind(body.email).first<{ id: number; email: string; password_hash: string; is_superadmin: number }>()

  if (!account || !(await verifyPassword(body.password, account.password_hash))) {
    throw createError({ statusCode: 401, message: 'Email hoặc mật khẩu không đúng' })
  }

  const session = await useSession(event, { password: config.sessionSecret })
  await session.update({
    admin: true,
    superAdmin: account.is_superadmin === 1,
    adminEmail: account.email,
    adminId: account.id
  })

  return { success: true }
})
