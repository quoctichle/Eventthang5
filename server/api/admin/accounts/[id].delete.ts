// DELETE /api/admin/accounts/[id] - Xóa tài khoản admin (chỉ super admin, không xóa chính mình hoặc super admin khác)
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const session = await useSession(event, { password: config.sessionSecret })
  if (!session.data?.admin) throw createError({ statusCode: 401, message: 'Unauthorized' })
  if (!session.data?.superAdmin) throw createError({ statusCode: 403, message: 'Chỉ super admin mới có quyền này' })

  const { DB } = event.context.cloudflare.env
  const id = Number(getRouterParam(event, 'id'))

  const account = await DB.prepare(
    'SELECT id, email, is_superadmin FROM admin_accounts WHERE id = ?'
  ).bind(id).first<{ id: number; email: string; is_superadmin: number }>()

  if (!account) throw createError({ statusCode: 404, message: 'Tài khoản không tồn tại' })
  if (account.is_superadmin === 1) throw createError({ statusCode: 400, message: 'Không thể xóa tài khoản super admin' })
  if (account.id === session.data?.adminId) throw createError({ statusCode: 400, message: 'Không thể xóa tài khoản đang đăng nhập' })

  await DB.prepare('DELETE FROM admin_accounts WHERE id = ?').bind(id).run()

  return { success: true }
})
