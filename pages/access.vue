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

function onInput(e: Event) {
  code.value = (e.target as HTMLInputElement).value.toUpperCase()
}

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
          <div class="lang-option" :class="{ active: lang === 'ja' }" @click.stop="selectLang('ja')">
            <div class="flag-circle"><img src="/nhat.png" alt="JP" class="flag-icon" /></div>
            <span class="lang-text">日本語</span>
          </div>
          <div class="lang-option" :class="{ active: lang === 'en' }" @click.stop="selectLang('en')">
            <div class="flag-circle"><img src="/anh.png" alt="EN" class="flag-icon" /></div>
            <span class="lang-text">English</span>
          </div>
          <div class="lang-option" :class="{ active: lang === 'vi' }" @click.stop="selectLang('vi')">
            <div class="flag-circle"><img src="/viet.png" alt="VI" class="flag-icon" /></div>
            <span class="lang-text">Tiếng Việt</span>
          </div>
          <div class="lang-option" :class="{ active: lang === 'my' }" @click.stop="selectLang('my')">
            <div class="flag-circle"><img src="/myanma.png" alt="MY" class="flag-icon" /></div>
            <span class="lang-text">မြန်မာ</span>
          </div>
        </div>
      </Transition>
    </div>

    <!-- Background decoration -->
    <div class="bg-orb orb1"></div>
    <div class="bg-orb orb2"></div>
    <div class="bg-orb orb3"></div>

    <!-- Card -->
    <div class="card">
      <!-- Logo -->
      <div class="brand">
        <div class="logo-wrap">
          <div class="logo-glow"></div>
          <img src="/logo.png" alt="Logo" class="logo-img" />
        </div>
      </div>

      <h1>{{ t.access_title }}</h1>
      <p>{{ t.access_desc }}</p>

      <form @submit.prevent="submit">
        <div class="input-wrap" :class="{ 'has-error': error }">
          <input
            :value="code"
            type="text"
            :placeholder="t.access_placeholder"
            required
            autocomplete="off"
            autofocus
            :disabled="loading"
            @input="onInput"
          />
        </div>
        <Transition name="err">
          <p v-if="error" class="error">
            <svg viewBox="0 0 20 20" fill="currentColor" class="err-icon"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>
            {{ error }}
          </p>
        </Transition>
        <button type="submit" :disabled="loading" class="submit-btn">
          <span v-if="loading" class="spinner"></span>
          <span>{{ loading ? t.access_loading : t.access_btn }}</span>
        </button>
      </form>
    </div>
  </div>
</template>

<style>
*, *::before, *::after { box-sizing: border-box; }
html, body {
  margin: 0;
  padding: 0;
  background-color: #1e293b;
  min-height: 100%;
}
</style>

<style scoped>

.page {
  position: relative;
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(160deg, #1e293b 0%, #312e81 100%);
  padding: env(safe-area-inset-top, 4.5rem) 1rem env(safe-area-inset-bottom, 1rem);
  padding-top: max(4.5rem, env(safe-area-inset-top));
  overflow: hidden;
}

/* Orb background decorations */
.bg-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(90px);
  pointer-events: none;
  opacity: 0.25;
}
.orb1 { width: 500px; height: 500px; background: #6366f1; top: -150px; left: -150px; }
.orb2 { width: 400px; height: 400px; background: #a855f7; bottom: -100px; right: -100px; }
.orb3 { width: 300px; height: 300px; background: #3b82f6; top: 40%; left: 50%; transform: translate(-50%, -50%); opacity: 0.15; }

/* Language switcher */
.lang-switcher {
  position: absolute;
  top: 1.25rem;
  right: 1.25rem;
  z-index: 20;
  user-select: none;
}
.current-lang {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.3rem 0.6rem 0.3rem 0.35rem;
  border-radius: 50px;
  cursor: pointer;
  border: 1.5px solid rgba(255,255,255,0.2);
  background: rgba(255,255,255,0.07);
  backdrop-filter: blur(8px);
  transition: background 0.2s, transform 0.2s;
}
.current-lang:hover { background: rgba(255,255,255,0.12); transform: scale(1.04); }
.flag-circle {
  width: 28px; height: 28px; border-radius: 50%; overflow: hidden;
  display: flex; align-items: center; justify-content: center;
  background: #f8fafc; border: 1px solid rgba(255,255,255,0.2);
  flex-shrink: 0;
}
.flag-icon { width: 100%; height: 100%; object-fit: cover; transform: scale(1.2); }
.chevron { width: 16px; height: 16px; color: rgba(255,255,255,0.7); transition: transform 0.3s; }
.chevron.rotate { transform: rotate(180deg); }
.lang-dropdown {
  position: absolute; top: calc(100% + 0.5rem); right: 0;
  background: #1e1e2e; border: 1px solid rgba(255,255,255,0.1);
  border-radius: 14px; overflow: hidden;
  box-shadow: 0 16px 40px rgba(0,0,0,0.5);
  display: flex; flex-direction: column; min-width: 155px;
}
.lang-option {
  padding: 0.65rem 1rem; cursor: pointer;
  display: flex; align-items: center; gap: 0.75rem; transition: background 0.15s;
}
.lang-option:hover { background: rgba(255,255,255,0.07); }
.lang-option.active { background: rgba(99,102,241,0.25); }
.lang-option.active .lang-text { color: #a5b4fc; font-weight: 700; }
.lang-text { color: rgba(255,255,255,0.85); font-weight: 500; font-size: 0.9rem; }

/* Card */
.card {
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 420px;
  background: rgba(255,255,255,0.04);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 24px;
  padding: 2.5rem 2rem 2rem;
  text-align: center;
  box-shadow: 0 32px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08);
}

/* Logo */
.brand { display: flex; justify-content: center; margin-bottom: 1.75rem; }
.logo-wrap {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}
.logo-glow {
  position: absolute;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(99,102,241,0.5) 0%, rgba(168,85,247,0.25) 50%, transparent 70%);
  animation: pulse-glow 2.5s ease-in-out infinite;
  pointer-events: none;
}
.logo-img {
  position: relative;
  z-index: 1;
  width: 90px;
  height: 90px;
  object-fit: contain;
  filter: drop-shadow(0 0 16px rgba(99,102,241,0.6)) drop-shadow(0 0 32px rgba(168,85,247,0.3));
  animation: float 3s ease-in-out infinite;
}
@keyframes pulse-glow {
  0%, 100% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.2); opacity: 1; }
}
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

h1 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #fff;
  margin: 0 0 0.5rem;
  letter-spacing: -0.01em;
}
p {
  color: rgba(255,255,255,0.5);
  font-size: 0.88rem;
  margin: 0 0 1.75rem;
  line-height: 1.5;
}

/* Input */
.input-wrap {
  position: relative;
  margin-bottom: 0.5rem;
}
.input-wrap::before {
  content: '';
  position: absolute;
  inset: -1px;
  border-radius: 13px;
  background: linear-gradient(135deg, #6366f1, #a855f7);
  opacity: 0;
  transition: opacity 0.2s;
  pointer-events: none;
}
.input-wrap:focus-within::before { opacity: 1; }
input {
  position: relative;
  z-index: 1;
  width: 100%;
  padding: 0.9rem 1.1rem;
  background: rgba(255,255,255,0.06);
  border: 1.5px solid rgba(255,255,255,0.12);
  border-radius: 12px;
  font-size: 1.05rem;
  text-align: center;
  letter-spacing: 0.15em;
  font-weight: 700;
  color: #fff;
  text-transform: uppercase;
  outline: none;
  transition: border-color 0.2s, background 0.2s;
}
input::placeholder { color: rgba(255,255,255,0.3); letter-spacing: 0.05em; font-weight: 400; text-transform: none; }
input:focus { border-color: transparent; background: rgba(255,255,255,0.09); }
input:disabled { opacity: 0.5; }
.has-error input { border-color: #f87171; }

/* Error */
.error {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: #f87171;
  font-size: 0.82rem;
  font-weight: 500;
  margin: 0.5rem 0 0;
  justify-content: center;
}
.err-icon { width: 15px; height: 15px; flex-shrink: 0; }
.err-enter-active, .err-leave-active { transition: opacity 0.2s, transform 0.2s; }
.err-enter-from, .err-leave-to { opacity: 0; transform: translateY(-4px); }

/* Button */
.submit-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  margin-top: 1.25rem;
  padding: 0.9rem;
  background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  letter-spacing: 0.02em;
  box-shadow: 0 8px 24px rgba(99,102,241,0.4);
  transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
}
.submit-btn:hover:not(:disabled) {
  opacity: 0.92;
  transform: translateY(-1px);
  box-shadow: 0 12px 32px rgba(99,102,241,0.5);
}
.submit-btn:active:not(:disabled) { transform: translateY(0); }
.submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* Spinner */
.spinner {
  width: 16px; height: 16px; border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  animation: spin 0.7s linear infinite;
  flex-shrink: 0;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Transitions */
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s, transform 0.15s; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-6px); }
</style>
