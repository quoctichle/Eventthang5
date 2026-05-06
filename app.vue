<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<style>
@font-face {
  font-family: 'FSMagistral';
  src: url('/FS%20MAGISTRAL-BOLD.TTF') format('truetype');
  font-weight: normal;
  font-style: normal;
}

body, html, * {
  font-family: 'FSMagistral', 'Inter', system-ui, -apple-system, sans-serif;
}
</style>
