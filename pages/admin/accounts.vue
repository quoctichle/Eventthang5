<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })

const { data: me } = await useFetch('/api/auth/me')
if (!me.value?.superAdmin) await navigateTo('/admin')

const { data: accounts, refresh } = await useFetch('/api/admin/accounts')

const newEmail = ref('')
const newPassword = ref('')
const createError = ref('')
const creating = ref(false)

async function createAccount() {
  createError.value = ''
  creating.value = true
  try {
    await $fetch('/api/admin/accounts', {
      method: 'POST',
      body: { email: newEmail.value, password: newPassword.value }
    })
    newEmail.value = ''
    newPassword.value = ''
    await refresh()
  } catch (e: any) {
    createError.value = e.data?.message || 'Lỗi tạo tài khoản'
  } finally {
    creating.value = false
  }
}

async function deleteAccount(id: number, email: string) {
  if (!confirm(`Xóa tài khoản ${email}?`)) return
  try {
    await $fetch(`/api/admin/accounts/${id}`, { method: 'DELETE' })
    await refresh()
  } catch (e: any) {
    alert(e.data?.message || 'Lỗi xóa tài khoản')
  }
}
</script>

<template>
  <div>
    <h1 class="page-title">👤 Quản lý tài khoản admin</h1>

    <!-- Tạo tài khoản mới -->
    <section class="card">
      <h2>Thêm tài khoản mới</h2>
      <form class="form-row" @submit.prevent="createAccount">
        <input v-model="newEmail" type="email" placeholder="Email" required :disabled="creating" />
        <input v-model="newPassword" type="password" placeholder="Mật khẩu (tối thiểu 6 ký tự)" required minlength="6" :disabled="creating" />
        <button type="submit" class="btn-primary" :disabled="creating">
          {{ creating ? 'Đang tạo...' : '+ Thêm' }}
        </button>
      </form>
      <p v-if="createError" class="error">{{ createError }}</p>
    </section>

    <!-- Danh sách tài khoản -->
    <section class="card">
      <h2>Danh sách tài khoản ({{ accounts?.length ?? 0 }})</h2>
      <table v-if="accounts && accounts.length">
        <thead>
          <tr>
            <th>Email</th>
            <th>Vai trò</th>
            <th>Ngày tạo</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="a in accounts" :key="a.id">
            <td>{{ a.email }}</td>
            <td>
              <span v-if="a.is_superadmin" class="badge super">⭐ Super Admin</span>
              <span v-else class="badge normal">Admin</span>
            </td>
            <td>{{ a.created_at }}</td>
            <td>
              <button
                v-if="!a.is_superadmin"
                class="btn-del"
                @click="deleteAccount(a.id, a.email)"
              >Xóa</button>
              <span v-else class="protected">—</span>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-else class="empty">Chưa có tài khoản nào.</p>
    </section>
  </div>
</template>

<style scoped>
.page-title { font-size: 1.3rem; font-weight: 700; color: #1e293b; margin-bottom: 1.5rem; }
.card { background: white; border-radius: 10px; padding: 1.5rem; margin-bottom: 1.5rem; border: 1px solid #e2e8f0; }
h2 { font-size: 1rem; font-weight: 600; margin-bottom: 1rem; color: #1e293b; }
.form-row { display: flex; gap: 0.75rem; flex-wrap: wrap; align-items: flex-end; }
.form-row input { flex: 1; min-width: 180px; padding: 0.6rem 0.8rem; border: 1px solid #cbd5e1; border-radius: 7px; font-size: 0.9rem; }
.form-row input:focus { outline: none; border-color: #2563eb; }
.btn-primary { background: #2563eb; color: white; border: none; padding: 0.6rem 1.2rem; border-radius: 7px; cursor: pointer; font-size: 0.9rem; font-weight: 500; white-space: nowrap; }
.btn-primary:hover { background: #1d4ed8; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.error { color: #dc2626; font-size: 0.85rem; margin-top: 0.75rem; }
table { width: 100%; border-collapse: collapse; }
th, td { text-align: left; padding: 0.75rem; border-bottom: 1px solid #f1f5f9; font-size: 0.88rem; }
th { color: #64748b; font-weight: 600; }
.badge { padding: 0.25rem 0.6rem; border-radius: 20px; font-size: 0.8rem; font-weight: 500; }
.badge.super { background: #ede9fe; color: #7c3aed; }
.badge.normal { background: #dbeafe; color: #1d4ed8; }
.btn-del { background: #fee2e2; color: #dc2626; border: none; padding: 0.3rem 0.7rem; border-radius: 5px; cursor: pointer; font-size: 0.8rem; }
.btn-del:hover { background: #fecaca; }
.protected { color: #cbd5e1; }
.empty { color: #94a3b8; }
</style>
