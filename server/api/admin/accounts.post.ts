import { hashPassword } from '~/server/utils/password'

// POST /api/admin/accounts - Tạo tài khoản admin mới (chỉ super admin)
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const session = await useSession(event, { password: config.sessionSecret })
  if (!session.data?.admin) throw createError({ statusCode: 401, message: 'Unauthorized' })
  if (!session.data?.superAdmin) throw createError({ statusCode: 403, message: 'Chỉ super admin mới có quyền tạo tài khoản' })

  const { DB } = event.context.cloudflare.env
  const { email, password } = await readBody<{ email: string; password: string }>(event)

  if (!email || !password) {
    throw createError({ statusCode: 400, message: 'Vui lòng nhập email và mật khẩu' })
  }
  if (password.length < 6) {
    throw createError({ statusCode: 400, message: 'Mật khẩu phải ít nhất 6 ký tự' })
  }

  const existing = await DB.prepare(
    'SELECT id FROM admin_accounts WHERE LOWER(email) = LOWER(?)'
  ).bind(email).first()
  if (existing) throw createError({ statusCode: 409, message: 'Email này đã tồn tại' })

  const hash = await hashPassword(password)
  await DB.prepare(
    'INSERT INTO admin_accounts (email, password_hash, is_superadmin) VALUES (?, ?, 0)'
  ).bind(email, hash).run()

  return { success: true }
})
