<script setup lang="ts">
definePageMeta({ layout: false })

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)
const showPassword = ref(false)
const remember = ref(false)

onMounted(() => {
  const saved = localStorage.getItem('admin_login_cred')
  if (saved) {
    try {
      const data = JSON.parse(saved)
      if (data.email) email.value = data.email
      if (data.password) password.value = data.password
      remember.value = true
    } catch(e) {}
  }
})

async function login() {
  error.value = ''
  loading.value = true
  try {
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: { email: email.value, password: password.value },
    })
    
    if (remember.value) {
      localStorage.setItem('admin_login_cred', JSON.stringify({ email: email.value, password: password.value }))
    } else {
      localStorage.removeItem('admin_login_cred')
    }

    await navigateTo('/admin')
  } catch (e: any) {
    error.value = e.data?.message || 'Đăng nhập thất bại'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-box">
      <div class="logo">⚙️ Admin Panel</div>
      <h1>Đăng nhập</h1>

      <form @submit.prevent="login">
        <div class="field">
          <label>Email</label>
          <input
            v-model="email"
            type="email"
            placeholder="Nhập email..."
            required
            autocomplete="email"
          />
        </div>
        <div class="field">
          <label>Mật khẩu</label>
          <div class="password-wrap">
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Nhập mật khẩu..."
              required
              autocomplete="current-password"
            />
            <button type="button" class="eye-btn" @click="showPassword = !showPassword">
              <svg v-if="!showPassword" viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
              <svg v-else viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
            </button>
          </div>
        </div>

        <div class="field-remember">
          <label>
            <input type="checkbox" v-model="remember" /> <span>Lưu đăng nhập</span>
          </label>
        </div>

        <p v-if="error" class="error">{{ error }}</p>

        <button type="submit" :disabled="loading">
          {{ loading ? 'Đang đăng nhập...' : 'Đăng nhập' }}
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-box {
  background: white;
  border-radius: 12px;
  padding: 2.5rem 2rem;
  width: 100%;
  max-width: 380px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
}

.logo {
  font-size: 1.5rem;
  font-weight: bold;
  text-align: center;
  margin-bottom: 0.5rem;
}

h1 {
  text-align: center;
  font-size: 1.1rem;
  color: #64748b;
  margin-bottom: 1.5rem;
  font-weight: 400;
}

.field {
  margin-bottom: 1rem;
}

.field label {
  display: block;
  font-size: 0.85rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.4rem;
}

.field input {
  width: 100%;
  padding: 0.65rem 0.8rem;
  border: 1px solid #cbd5e1;
  border-radius: 7px;
  font-size: 0.95rem;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

.field input:focus {
  outline: none;
  border-color: #2563eb;
}

.password-wrap {
  position: relative;
  display: flex;
  align-items: center;
}
.password-wrap input {
  padding-right: 2.5rem;
}
.eye-btn {
  position: absolute;
  right: 0.5rem;
  background: transparent !important;
  width: auto !important;
  border: none;
  padding: 0 !important;
  color: #64748b;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.eye-btn:hover {
  color: #0f172a;
}

.field-remember {
  margin-bottom: 1.5rem;
}
.field-remember label {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.9rem;
  color: #475569;
  cursor: pointer;
  user-select: none;
}
.field-remember input {
  margin: 0;
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.error {
  color: #dc2626;
  font-size: 0.85rem;
  margin-bottom: 0.75rem;
  background: #fee2e2;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
}

button[type="submit"] {
  width: 100%;
  background: #2563eb;
  color: white;
  border: none;
  padding: 0.75rem;
  border-radius: 7px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  margin-top: 0.5rem;
  transition: background 0.2s;
}

button[type="submit"]:hover {
  background: #1d4ed8;
}

button[type="submit"]:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
