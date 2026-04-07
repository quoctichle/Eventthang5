<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })

const { data: codes, refresh } = await useFetch('/api/admin/codes')

const generating = ref(false)
const lastGenerated = ref<string[]>([])
const selectedIds = ref<number[]>([])
const bulkDeleting = ref(false)
const spunPopupCode = ref('')   // code đã quay, hiển thị popup
const bulkResultMsg = ref('')   // thông báo sau khi xoá hàng loạt

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

function tryDeleteCode(c: any) {
  if (c.is_spun) {
    spunPopupCode.value = c.code
    return
  }
  if (!confirm(`Xóa mã ${c.code}?`)) return
  $fetch(`/api/admin/codes/${c.id}`, { method: 'DELETE' }).then(() => refresh())
}

// Checkbox logic
const nonSpunCodes = computed(() => (codes.value as any[] ?? []).filter(c => !c.is_spun))
const allSelected = computed(() =>
  nonSpunCodes.value.length > 0 && nonSpunCodes.value.every((c: any) => selectedIds.value.includes(c.id))
)
function toggleAll() {
  if (allSelected.value) {
    selectedIds.value = []
  } else {
    selectedIds.value = nonSpunCodes.value.map((c: any) => c.id)
  }
}
function toggleOne(id: number) {
  const idx = selectedIds.value.indexOf(id)
  if (idx >= 0) selectedIds.value.splice(idx, 1)
  else selectedIds.value.push(id)
}

async function bulkDelete() {
  if (!selectedIds.value.length) return
  if (!confirm(`Xóa ${selectedIds.value.length} mã đã chọn?`)) return
  bulkDeleting.value = true
  bulkResultMsg.value = ''
  try {
    const res = await $fetch<any>('/api/admin/codes/bulk-delete', {
      method: 'POST',
      body: { ids: selectedIds.value }
    })
    selectedIds.value = []
    await refresh()
    if (res.skipped > 0) {
      bulkResultMsg.value = `✅ Đã xóa ${res.deleted} mã. ⚠️ Bỏ qua ${res.skipped} mã đã quay: ${res.skippedCodes.join(', ')}`
    } else {
      bulkResultMsg.value = `✅ Đã xóa ${res.deleted} mã thành công.`
    }
  } catch (e: any) {
    bulkResultMsg.value = `❌ ${e.data?.message || 'Lỗi xảy ra'}`
  } finally {
    bulkDeleting.value = false
  }
}
</script>

<template>
  <div>
    <h1 class="page-title">🎫 Quản lý mã truy cập</h1>

    <!-- Popup mã đã sử dụng -->
    <Transition name="fade">
      <div v-if="spunPopupCode" class="popup-overlay" @click="spunPopupCode = ''">
        <div class="popup-box" @click.stop>
          <div class="popup-icon">🔒</div>
          <h3>Mã đã được sử dụng</h3>
          <p>Mã <code>{{ spunPopupCode }}</code> đã được dùng để quay, không thể xóa.</p>
          <button class="btn-close-popup" @click="spunPopupCode = ''">Đóng</button>
        </div>
      </div>
    </Transition>

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
      <div class="list-header">
        <h2>Danh sách mã ({{ codes?.length ?? 0 }})</h2>
        <div class="bulk-actions">
          <span v-if="selectedIds.length" class="sel-count">{{ selectedIds.length }} đã chọn</span>
          <button
            v-if="selectedIds.length"
            class="btn-bulk-del"
            :disabled="bulkDeleting"
            @click="bulkDelete"
          >
            {{ bulkDeleting ? 'Đang xóa...' : `🗑 Xóa ${selectedIds.length} mã` }}
          </button>
        </div>
      </div>

      <p v-if="bulkResultMsg" class="bulk-result">{{ bulkResultMsg }}</p>

      <table v-if="codes && codes.length">
        <thead>
          <tr>
            <th class="col-cb">
              <input
                type="checkbox"
                :checked="allSelected"
                :indeterminate="selectedIds.length > 0 && !allSelected"
                @change="toggleAll"
              />
            </th>
            <th>Mã</th>
            <th>Ghi chú</th>
            <th>Trạng thái</th>
            <th>Ngày tạo</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in codes" :key="c.id" :class="{ 'row-spun': c.is_spun }">
            <td class="col-cb">
              <input
                v-if="!c.is_spun"
                type="checkbox"
                :checked="selectedIds.includes(c.id)"
                @change="toggleOne(c.id)"
              />
              <span v-else class="cb-disabled">—</span>
            </td>
            <td><code>{{ c.code }}</code></td>
            <td>{{ c.label || '—' }}</td>
            <td>
              <span v-if="c.is_spun" class="badge spun">Đã quay</span>
              <span v-else :class="c.active ? 'badge active' : 'badge inactive'">{{ c.active ? 'Còn hiệu lực' : 'Đã vô hiệu' }}</span>
            </td>
            <td>{{ c.created_at }}</td>
            <td>
              <button
                v-if="c.is_spun"
                class="btn-del btn-del-disabled"
                @click="spunPopupCode = c.code"
                title="Mã đã được sử dụng"
              >🔒 Đã dùng</button>
              <button v-else class="btn-del" @click="tryDeleteCode(c)">Xóa</button>
            </td>
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
/* List header & bulk */
.list-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.75rem; }
.list-header h2 { margin-bottom: 0; }
.bulk-actions { display: flex; align-items: center; gap: 0.75rem; }
.sel-count { font-size: 0.85rem; color: #64748b; font-weight: 500; }
.btn-bulk-del { background: #dc2626; color: white; border: none; padding: 0.45rem 1rem; border-radius: 7px; cursor: pointer; font-size: 0.85rem; font-weight: 600; }
.btn-bulk-del:hover:not(:disabled) { background: #b91c1c; }
.btn-bulk-del:disabled { opacity: 0.6; cursor: not-allowed; }
.bulk-result { font-size: 0.85rem; margin-bottom: 0.75rem; color: #334155; background: #f8fafc; padding: 0.5rem 0.75rem; border-radius: 7px; border: 1px solid #e2e8f0; }
/* Table */
table { width: 100%; border-collapse: collapse; }
th, td { text-align: left; padding: 0.75rem; border-bottom: 1px solid #f1f5f9; font-size: 0.88rem; }
th { color: #64748b; font-weight: 600; }
td code { background: #f1f5f9; padding: 0.2rem 0.5rem; border-radius: 4px; font-weight: 600; letter-spacing: 0.05em; }
.col-cb { width: 40px; text-align: center; }
.cb-disabled { color: #cbd5e1; }
.row-spun { background: #fffbeb; }
input[type="checkbox"] { width: 16px; height: 16px; cursor: pointer; accent-color: #2563eb; }
.badge { padding: 0.25rem 0.6rem; border-radius: 20px; font-size: 0.8rem; font-weight: 500; }
.badge.active { background: #dcfce7; color: #15803d; }
.badge.spun { background: #fef3c7; color: #d97706; }
.badge.inactive { background: #fee2e2; color: #dc2626; }
.btn-del { background: #fee2e2; color: #dc2626; border: none; padding: 0.3rem 0.7rem; border-radius: 5px; cursor: pointer; font-size: 0.8rem; }
.btn-del:hover { background: #fecaca; }
.btn-del-disabled { background: #f1f5f9; color: #94a3b8; cursor: pointer; }
.btn-del-disabled:hover { background: #e2e8f0; }
.empty { color: #94a3b8; }
/* Popup */
.popup-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.popup-box { background: white; border-radius: 16px; padding: 2rem 2.5rem; max-width: 380px; width: 90%; text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
.popup-icon { font-size: 2.5rem; margin-bottom: 0.5rem; }
.popup-box h3 { font-size: 1.1rem; font-weight: 700; color: #1e293b; margin: 0 0 0.5rem; }
.popup-box p { color: #64748b; font-size: 0.9rem; margin: 0 0 1.5rem; }
.popup-box p code { background: #f1f5f9; padding: 0.15rem 0.4rem; border-radius: 4px; font-weight: 600; }
.btn-close-popup { background: #2563eb; color: white; border: none; padding: 0.6rem 2rem; border-radius: 8px; cursor: pointer; font-size: 0.9rem; font-weight: 600; }
.btn-close-popup:hover { background: #1d4ed8; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
