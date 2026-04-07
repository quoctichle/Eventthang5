<script setup lang="ts">
definePageMeta({ layout: false })

const lang = useLang()
const t = computed(() => i18nData[lang.value])
const showLangDropdown = ref(false)

function selectLang(l: typeof lang.value) {
  lang.value = l
  showLangDropdown.value = false
}

const code = ref('')
const error = ref('')
const loading = ref(false)

async function submit() {
  error.value = ''
  loading.value = true
  try {
    await $fetch('/api/auth/access', { method: 'POST', body: { code: code.value } })
    const spin = await $fetch<{ spun: boolean }>('/api/spin-result')
    if (spin.spun) {
      await navigateTo('/?result=1')
    } else {
      await navigateTo('/')
    }
  } catch (e: any) {
    error.value = e.data?.message || t.value.access_error_default
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="page" @click="showLangDropdown = false">
    <!-- Language switcher -->
    <div class="lang-switcher" @click.stop="showLangDropdown = !showLangDropdown">
      <div class="current-lang">
        <div class="flag-circle">
          <img :src="flags[lang]" alt="Language" class="flag-icon" />
        </div>
        <svg class="chevron" :class="{ rotate: showLangDropdown }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
      </div>
      <Transition name="fade">
        <div v-if="showLangDropdown" class="lang-dropdown">
          <div class="lang-option" :class="{ active: lang === 'ja' }" @click="selectLang('ja')">
            <div class="flag-circle"><img src="/nhat.png" alt="JP" class="flag-icon" /></div>
            <span class="lang-text">日本語</span>
          </div>
          <div class="lang-option" :class="{ active: lang === 'en' }" @click="selectLang('en')">
            <div class="flag-circle"><img src="/anh.png" alt="EN" class="flag-icon" /></div>
            <span class="lang-text">English</span>
          </div>
          <div class="lang-option" :class="{ active: lang === 'vi' }" @click="selectLang('vi')">
            <div class="flag-circle"><img src="/viet.png" alt="VI" class="flag-icon" /></div>
            <span class="lang-text">Tiếng Việt</span>
          </div>
          <div class="lang-option" :class="{ active: lang === 'my' }" @click="selectLang('my')">
            <div class="flag-circle"><img src="/myanma.png" alt="MY" class="flag-icon" /></div>
            <span class="lang-text">မြန်မာ</span>
          </div>
        </div>
      </Transition>
    </div>

    <div class="box">
      <div class="icon">🎫</div>
      <h1>{{ t.access_title }}</h1>
      <p>{{ t.access_desc }}</p>
      <form @submit.prevent="submit">
        <input
          v-model="code"
          type="text"
          :placeholder="t.access_placeholder"
          required
          autocomplete="off"
          autofocus
          :disabled="loading"
        />
        <p v-if="error" class="error">{{ error }}</p>
        <button type="submit" :disabled="loading">
          {{ loading ? t.access_loading : t.access_btn }}
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.page {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(160deg, #1e293b 0%, #312e81 100%);
  padding: 1rem;
}
.lang-switcher {
  position: absolute;
  top: 1rem;
  right: 1rem;
  z-index: 10;
  user-select: none;
}
.current-lang {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  background: transparent;
  padding: 0.35rem 0.6rem 0.35rem 0.4rem;
  border-radius: 50px;
  cursor: pointer;
  border: 2px solid #f59e0b;
  box-shadow: 0 4px 12px rgba(245,158,11,0.2);
  transition: transform 0.2s, background 0.2s;
}
.current-lang:hover { transform: scale(1.05); background: rgba(255,255,255,0.05); }
.flag-circle {
  width: 32px; height: 32px; border-radius: 50%; overflow: hidden;
  display: flex; align-items: center; justify-content: center;
  background: #f8fafc; border: 1px solid #e2e8f0;
}
.flag-icon { width: 100%; height: 100%; object-fit: cover; transform: scale(1.2); }
.chevron { width: 18px; height: 18px; color: #10b981; transition: transform 0.3s ease; margin-right: 0.2rem; }
.chevron.rotate { transform: rotate(180deg); }
.lang-dropdown {
  position: absolute; top: calc(100% + 0.6rem); right: 0;
  background: #f8fafc; border-radius: 16px; overflow: hidden;
  box-shadow: 0 10px 25px rgba(0,0,0,0.3); display: flex;
  flex-direction: column; min-width: 160px; border: 1px solid #e2e8f0;
}
.lang-option {
  padding: 0.7rem 1.2rem; cursor: pointer;
  display: flex; align-items: center; gap: 0.8rem; transition: background 0.2s;
}
.lang-option:hover { background: #e2e8f0; }
.lang-option.active { background: #cbd5e1; }
.lang-option.active .lang-text { color: #064e3b; font-weight: 700; }
.lang-text { color: #334155; font-weight: 600; font-size: 1rem; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s, transform 0.15s; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-6px); }
.box {
  background: white; border-radius: 20px; padding: 2.5rem 2rem;
  width: 100%; max-width: 400px; text-align: center;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}
.icon { font-size: 2.5rem; margin-bottom: 0.5rem; }
h1 { font-size: 1.4rem; font-weight: 700; color: #1e293b; margin: 0 0 0.5rem; }
p { color: #64748b; font-size: 0.9rem; margin-bottom: 1.5rem; }
input {
  width: 100%; padding: 0.8rem 1rem; border: 2px solid #e2e8f0;
  border-radius: 10px; font-size: 1rem; text-align: center;
  letter-spacing: 0.1em; font-weight: 600; box-sizing: border-box; text-transform: uppercase;
}
input:focus { outline: none; border-color: #2563eb; }
input:disabled { background: #f8fafc; }
.error { color: #dc2626; font-size: 0.85rem; margin: 0.5rem 0; }
button {
  width: 100%; margin-top: 1rem;
  background: linear-gradient(135deg, #2563eb, #7c3aed);
  color: white; border: none; padding: 0.85rem;
  border-radius: 10px; font-size: 1rem; font-weight: 700; cursor: pointer;
}
button:hover:not(:disabled) { opacity: 0.9; }
button:disabled { opacity: 0.6; cursor: not-allowed; }
</style>
