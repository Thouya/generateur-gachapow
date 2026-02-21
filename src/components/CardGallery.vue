<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold">Cartes générées</h3>
        <div class="flex items-center gap-2">
          <UBadge v-if="cards.length > 0" color="primary" variant="subtle">
            {{ cards.length }} cartes
          </UBadge>
          <UButton
            v-if="cards.length > 0"
            icon="i-lucide-file-down"
            label="Exporter en PDF"
            color="primary"
            variant="soft"
            size="sm"
            :loading="exporting"
            @click="exportAllToPdf"
          />
        </div>
      </div>
    </template>

    <div v-if="cards.length === 0" class="text-center text-gray-400 py-8">
      <UIcon name="i-lucide-layers" class="text-4xl mb-3" />
      <p>Aucune carte générée. Sélectionne un type de carte, charge un CSV, puis clique sur "Générer".</p>
    </div>

    <template v-else>
      <!-- Barre de progression export -->
      <div v-if="exporting" class="px-4 pb-3">
        <div class="flex items-center gap-3">
          <UProgress :value="exportProgress" class="flex-1" />
          <span class="text-sm text-gray-500 whitespace-nowrap">{{ exportProgressText }}</span>
        </div>
      </div>

      <div ref="galleryRef" class="flex flex-wrap gap-6 p-4">
        <div
          v-for="(card, index) in cards"
          :key="card.id"
          class="flex-shrink-0 relative group"
        >
          <CardPreview :card-type="getCardType(card.cardTypeId)" :card-data="card.data" />
          <button
            class="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 dark:bg-gray-800/80 rounded-full p-1.5 shadow-sm hover:shadow cursor-pointer"
            title="Exporter cette carte en PDF"
            :disabled="exporting"
            @click="exportSingleCard(index)"
          >
            <UIcon name="i-lucide-download" class="text-gray-700 dark:text-gray-200" />
          </button>
        </div>
      </div>
    </template>
  </UCard>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useCardsStore } from '../stores/cards.js'
import CardPreview from './CardPreview.vue'
import { exportCardsToPdf } from '../utils/pdfExport.js'

const store = useCardsStore()

const galleryRef = ref(null)
const exporting = ref(false)
const exportProgress = ref(0)
const exportProgressText = ref('')

const cards = computed(() => store.generatedCards)

function getCardType(cardTypeId) {
  return store.cardTypes.find((t) => t.id === cardTypeId) || {}
}

function getCardElements() {
  if (!galleryRef.value) return []
  return Array.from(galleryRef.value.querySelectorAll('.card-preview'))
}

async function exportAllToPdf() {
  const elements = getCardElements()
  if (elements.length === 0) return

  exporting.value = true
  exportProgress.value = 0
  exportProgressText.value = `0 / ${elements.length}`

  try {
    await exportCardsToPdf(elements, {
      fileName: 'cartes-gachapow.pdf',
      onProgress(current, total) {
        exportProgress.value = Math.round((current / total) * 100)
        exportProgressText.value = `${current} / ${total}`
      },
    })
  } catch (err) {
    console.error('Erreur export PDF:', err)
  } finally {
    exporting.value = false
  }
}

async function exportSingleCard(index) {
  const elements = getCardElements()
  if (!elements[index]) return

  exporting.value = true
  exportProgress.value = 0
  exportProgressText.value = '1 / 1'

  try {
    await exportCardsToPdf([elements[index]], {
      fileName: `carte-${index + 1}.pdf`,
      onProgress() {
        exportProgress.value = 100
      },
    })
  } catch (err) {
    console.error('Erreur export PDF:', err)
  } finally {
    exporting.value = false
  }
}
</script>
