<template>
  <UApp>
    <Analytics />
    <SpeedInsights />
    <RouterView />
  </UApp>
</template>

<script setup>
import { Analytics } from '@vercel/analytics/vue'
import { SpeedInsights } from '@vercel/speed-insights/vue'
</script>
