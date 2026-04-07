// GET /api/admin/accounts - Lấy danh sách tài khoản admin (chỉ super admin)
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const session = await useSession(event, { password: config.sessionSecret })
  if (!session.data?.admin) throw createError({ statusCode: 401, message: 'Unauthorized' })
  if (!session.data?.superAdmin) throw createError({ statusCode: 403, message: 'Chỉ super admin mới có quyền này' })

  const { DB } = event.context.cloudflare.env

  await DB.prepare(`
    CREATE TABLE IF NOT EXISTS admin_accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      is_superadmin INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `).run()

  const { results } = await DB.prepare(
    'SELECT id, email, is_superadmin, created_at FROM admin_accounts ORDER BY created_at ASC'
  ).all()

  return results
})
