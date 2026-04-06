<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })

const prizes = ref<any[]>([])
const prizeForm = reactive({ name: '', quantity: 0, description: '' })
const prizeLoading = ref(false)

const totalQty = computed(() => prizes.value.reduce((s, p) => s + p.quantity, 0))
function ratio(qty: number) {
  if (!totalQty.value) return '0%'
  return ((qty / totalQty.value) * 100).toFixed(1) + '%'
}

async function loadPrizes() {
  prizes.value = await $fetch('/api/admin/prizes?event_id=1')
}

await loadPrizes()

async function addPrize() {
  if (!prizeForm.name) return
  prizeLoading.value = true
  try {
    await $fetch('/api/admin/prizes', {
      method: 'POST',
      body: { event_id: 1, ...prizeForm }
    })
    Object.assign(prizeForm, { name: '', quantity: 0, description: '' })
    await loadPrizes()
  } catch {
    alert('Có lỗi xảy ra khi thêm giải thưởng!')
  }
  prizeLoading.value = false
}

async function deletePrize(prizeId: number) {
  if (!confirm('Bạn có chắc muốn xóa giải thưởng này không?')) return
  try {
    await $fetch(`/api/admin/prizes/${prizeId}`, { method: 'DELETE' })
    await loadPrizes()
  } catch {
    alert('Có lỗi xảy ra khi xóa giải thưởng!')
  }
}
</script>

<template>
  <div>
    <h1 class="page-title">⚙️ Cấu hình giải thưởng — Vòng quay may mắn</h1>

    <section class="card">
      <h2>Thêm giải thưởng mới</h2>
      <form @submit.prevent="addPrize" class="prize-form">
        <div class="field">
          <label>Tên giải thưởng <span class="req">*</span></label>
          <input v-model="prizeForm.name" placeholder="VD: iPhone 15, Voucher 500k..." required />
        </div>
        <div class="field field-sm">
          <label>Số lượng / tháng</label>
          <input v-model.number="prizeForm.quantity" type="number" min="0" placeholder="0" />
        </div>
        <div class="field">
          <label>Ghi chú</label>
          <input v-model="prizeForm.description" placeholder="Thông tin thêm về giải thưởng..." />
        </div>
        <div class="field field-btn">
          <label>&nbsp;</label>
          <button type="submit" :disabled="prizeLoading">
            {{ prizeLoading ? 'Đang thêm...' : '+ Thêm giải thưởng' }}
          </button>
        </div>
      </form>
    </section>

    <section class="card">
      <h2>Danh sách giải thưởng ({{ prizes.length }})</h2>
      <table v-if="prizes.length">
        <thead>
          <tr>
            <th>Tên giải thưởng</th>
            <th>Số lượng / tháng</th>
            <th>Tỷ lệ trúng</th>
            <th>Ghi chú</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in prizes" :key="p.id">
            <td><strong>{{ p.name }}</strong></td>
            <td><span class="qty">{{ p.quantity }} suất</span></td>
            <td><span class="ratio">{{ ratio(p.quantity) }}</span></td>
            <td>{{ p.description || '—' }}</td>
            <td><button class="btn-del" @click="deletePrize(p.id)">Xóa</button></td>
          </tr>
        </tbody>
      </table>
      <p v-else class="empty">Chưa có giải thưởng nào. Hãy thêm giải thưởng ở trên.</p>
    </section>
  </div>
</template>

<style scoped>
.page-title { font-size: 1.3rem; font-weight: 700; color: #1e293b; margin-bottom: 1.5rem; }
.card { background: white; border-radius: 10px; padding: 1.5rem; margin-bottom: 1.5rem; border: 1px solid #e2e8f0; }
h2 { font-size: 1rem; font-weight: 600; margin-bottom: 1.2rem; color: #1e293b; }
.prize-form { display: flex; gap: 1rem; flex-wrap: wrap; align-items: flex-end; }
.field { display: flex; flex-direction: column; gap: 0.3rem; flex: 1; min-width: 160px; }
.field-sm { flex: 0 0 130px; min-width: 130px; }
.field-btn { flex: 0 0 auto; min-width: unset; }
label { font-size: 0.82rem; font-weight: 600; color: #475569; }
.req { color: #ef4444; }
input { padding: 0.6rem 0.8rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.9rem; width: 100%; box-sizing: border-box; }
input:focus { outline: none; border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
.field-btn button { background: #2563eb; color: white; border: none; padding: 0.65rem 1.3rem; border-radius: 6px; cursor: pointer; font-size: 0.9rem; white-space: nowrap; font-weight: 600; }
.field-btn button:hover { background: #1d4ed8; }
.field-btn button:disabled { opacity: 0.6; cursor: not-allowed; }
table { width: 100%; border-collapse: collapse; }
th, td { text-align: left; padding: 0.75rem; border-bottom: 1px solid #f1f5f9; font-size: 0.88rem; }
th { color: #64748b; font-weight: 600; background: #f8fafc; }
.qty { background: #eff6ff; color: #2563eb; padding: 0.2rem 0.6rem; border-radius: 20px; font-size: 0.82rem; font-weight: 600; }
.ratio { background: #f0fdf4; color: #16a34a; padding: 0.2rem 0.6rem; border-radius: 20px; font-size: 0.82rem; font-weight: 600; }
.btn-del { background: #fee2e2; color: #dc2626; border: none; padding: 0.3rem 0.7rem; border-radius: 5px; cursor: pointer; font-size: 0.8rem; }
.btn-del:hover { background: #fecaca; }
.empty { color: #94a3b8; font-size: 0.9rem; }
</style>
