<script setup lang="ts">
definePageMeta({ layout: false })

const code = ref('')
const error = ref('')
const loading = ref(false)

async function submit() {
  error.value = ''
  loading.value = true
  try {
    await $fetch('/api/auth/access', { method: 'POST', body: { code: code.value } })
    // Kiểm tra mã này đã quay chưa
    const spin = await $fetch<{ spun: boolean }>('/api/spin-result')
    if (spin.spun) {
      await navigateTo('/?result=1')
    } else {
      await navigateTo('/')
    }
  } catch (e: any) {
    error.value = e.data?.message || 'Mã không hợp lệ'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="page">
    <div class="box">
      <div class="icon">🎫</div>
      <h1>Nhập mã truy cập</h1>
      <p>Vui lòng nhập mã do ban tổ chức cấp để tiếp tục.</p>
      <form @submit.prevent="submit">
        <input
          v-model="code"
          type="text"
          placeholder="Nhập mã tại đây..."
          required
          autocomplete="off"
          autofocus
          :disabled="loading"
        />
        <p v-if="error" class="error">{{ error }}</p>
        <button type="submit" :disabled="loading">
          {{ loading ? 'Đang kiểm tra...' : 'Tiếp tục →' }}
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.page { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(160deg, #1e293b 0%, #312e81 100%); padding: 1rem; }
.box { background: white; border-radius: 20px; padding: 2.5rem 2rem; width: 100%; max-width: 400px; text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
.icon { font-size: 2.5rem; margin-bottom: 0.5rem; }
h1 { font-size: 1.4rem; font-weight: 700; color: #1e293b; margin: 0 0 0.5rem; }
p { color: #64748b; font-size: 0.9rem; margin-bottom: 1.5rem; }
input { width: 100%; padding: 0.8rem 1rem; border: 2px solid #e2e8f0; border-radius: 10px; font-size: 1rem; text-align: center; letter-spacing: 0.1em; font-weight: 600; box-sizing: border-box; text-transform: uppercase; }
input:focus { outline: none; border-color: #2563eb; }
input:disabled { background: #f8fafc; }
.error { color: #dc2626; font-size: 0.85rem; margin: 0.5rem 0; }
button { width: 100%; margin-top: 1rem; background: linear-gradient(135deg, #2563eb, #7c3aed); color: white; border: none; padding: 0.85rem; border-radius: 10px; font-size: 1rem; font-weight: 700; cursor: pointer; }
button:hover:not(:disabled) { opacity: 0.9; }
button:disabled { opacity: 0.6; cursor: not-allowed; }
</style>
