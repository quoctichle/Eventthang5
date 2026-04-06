<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })

const { data: codes, refresh } = await useFetch('/api/admin/codes')

const generating = ref(false)
const lastGenerated = ref<string[]>([])

// Tính prefix hiện tại để hiển thị
const now = new Date()
const currentPrefix = `T${now.getMonth() + 1}${now.getFullYear().toString().slice(-2)}`

async function generate10() {
  generating.value = true
  lastGenerated.value = []
  try {
    const res = await $fetch<{ codes: string[] }>('/api/admin/codes/generate', { method: 'POST' })
    lastGenerated.value = res.codes
    await refresh()
  } finally {
    generating.value = false
  }
}

async function deleteCode(id: number) {
  if (!confirm('Xóa mã này?')) return
  await $fetch(`/api/admin/codes/${id}`, { method: 'DELETE' })
  await refresh()
}
</script>

<template>
  <div>
    <h1 class="page-title">🎫 Quản lý mã truy cập</h1>

    <!-- Tạo mã tự động -->
    <section class="card">
      <h2>Tạo mã tự động (10 mã)</h2>
      <p class="hint">Mã sẽ có định dạng <code>{{ currentPrefix }}XXXXXX</code> — 6 ký tự ngẫu nhiên cuối.</p>
      <button class="btn-primary big" :disabled="generating" @click="generate10">
        {{ generating ? 'Đang tạo...' : '⚡ Tạo 10 mã ngay' }}
      </button>

      <div v-if="lastGenerated.length" class="generated-list">
        <p class="gen-label">✅ Vừa tạo:</p>
        <div class="code-chips">
          <span v-for="c in lastGenerated" :key="c" class="chip">{{ c }}</span>
        </div>
      </div>
    </section>

    <!-- Danh sách mã -->
    <section class="card">
      <h2>Danh sách mã ({{ codes?.length ?? 0 }})</h2>
      <table v-if="codes && codes.length">
        <thead>
          <tr>
            <th>Mã</th>
            <th>Ghi chú</th>
            <th>Trạng thái</th>
            <th>Ngày tạo</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in codes" :key="c.id">
            <td><code>{{ c.code }}</code></td>
            <td>{{ c.label || '—' }}</td>
            <td><span :class="c.active ? 'badge active' : 'badge inactive'">{{ c.active ? 'Còn hiệu lực' : 'Đã vô hiệu' }}</span></td>
            <td>{{ c.created_at }}</td>
            <td><button class="btn-del" @click="deleteCode(c.id)">Xóa</button></td>
          </tr>
        </tbody>
      </table>
      <p v-else class="empty">Chưa có mã nào.</p>
    </section>
  </div>
</template>

<style scoped>
.page-title { font-size: 1.3rem; font-weight: 700; color: #1e293b; margin-bottom: 1.5rem; }
.card { background: white; border-radius: 10px; padding: 1.5rem; margin-bottom: 1.5rem; border: 1px solid #e2e8f0; }
h2 { font-size: 1rem; font-weight: 600; margin-bottom: 0.75rem; color: #1e293b; }
.hint { font-size: 0.85rem; color: #64748b; margin-bottom: 1rem; }
.hint code { background: #f1f5f9; padding: 0.15rem 0.4rem; border-radius: 4px; }
.btn-primary { background: #2563eb; color: white; border: none; padding: 0.6rem 1.2rem; border-radius: 7px; cursor: pointer; font-size: 0.9rem; font-weight: 500; }
.btn-primary:hover { background: #1d4ed8; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-primary.big { padding: 0.75rem 2rem; font-size: 1rem; }
.generated-list { margin-top: 1rem; }
.gen-label { font-size: 0.85rem; color: #16a34a; font-weight: 500; margin-bottom: 0.5rem; }
.code-chips { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.chip { background: #dcfce7; color: #15803d; padding: 0.3rem 0.7rem; border-radius: 6px; font-family: monospace; font-size: 0.9rem; font-weight: 600; }
.row-form { display: flex; gap: 0.75rem; flex-wrap: wrap; }
.row-form input { flex: 1; min-width: 160px; padding: 0.6rem 0.8rem; border: 1px solid #cbd5e1; border-radius: 7px; font-size: 0.9rem; }
.error { color: #dc2626; font-size: 0.85rem; margin-top: 0.5rem; }
table { width: 100%; border-collapse: collapse; }
th, td { text-align: left; padding: 0.75rem; border-bottom: 1px solid #f1f5f9; font-size: 0.88rem; }
th { color: #64748b; font-weight: 600; }
td code { background: #f1f5f9; padding: 0.2rem 0.5rem; border-radius: 4px; font-weight: 600; letter-spacing: 0.05em; }
.badge { padding: 0.25rem 0.6rem; border-radius: 20px; font-size: 0.8rem; font-weight: 500; }
.badge.active { background: #dcfce7; color: #15803d; }
.badge.inactive { background: #fee2e2; color: #dc2626; }
.btn-del { background: #fee2e2; color: #dc2626; border: none; padding: 0.3rem 0.7rem; border-radius: 5px; cursor: pointer; font-size: 0.8rem; }
.btn-del:hover { background: #fecaca; }
.empty { color: #94a3b8; }
</style>
