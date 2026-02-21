<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold">Cartes générées</h3>
        <div class="flex items-center gap-2">
          <UBadge v-if="cards.length > 0" color="primary" variant="subtle">
            {{ cards.length }} cartes
          </UBadge>

          <!-- Bouton mode sélection -->
          <UButton
            v-if="cards.length > 0"
            :icon="selecting ? 'i-lucide-x' : 'i-lucide-check-square'"
            :label="selecting ? 'Annuler' : 'Sélectionner'"
            :color="selecting ? 'neutral' : 'neutral'"
            variant="soft"
            size="sm"
            :disabled="exporting"
            @click="toggleSelecting"
          />

          <!-- Export PDF -->
          <UButton
            v-if="cards.length > 0"
            icon="i-lucide-file-down"
            :label="exportLabel"
            color="primary"
            variant="soft"
            size="sm"
            :loading="exporting"
            :disabled="selecting && selectedIds.size === 0"
            @click="exportPdf"
          />
        </div>
      </div>
    </template>

    <div v-if="cards.length === 0" class="text-center text-gray-400 py-8">
      <UIcon name="i-lucide-layers" class="text-4xl mb-3" />
      <p>Aucune carte générée. Sélectionne un type de carte, charge un CSV, puis clique sur "Générer".</p>
    </div>

    <template v-else>
      <!-- Barre sélection -->
      <div v-if="selecting" class="px-4 pb-2 flex items-center gap-2">
        <UButton
          size="xs"
          variant="ghost"
          :label="selectedIds.size === cards.length ? 'Tout désélectionner' : 'Tout sélectionner'"
          @click="toggleAll"
        />
        <span v-if="selectedIds.size > 0" class="text-sm text-gray-500">
          {{ selectedIds.size }} sélectionnée{{ selectedIds.size > 1 ? 's' : '' }}
        </span>
      </div>

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
          :class="{ 'ring-3 ring-primary-500 rounded-xl': selecting && selectedIds.has(card.id) }"
        >
          <CardPreview :card-type="getCardType(card.cardTypeId)" :card-data="card.data" />

          <!-- Checkbox en mode sélection -->
          <div
            v-if="selecting"
            class="absolute top-2 left-2 z-10"
          >
            <input
              type="checkbox"
              :checked="selectedIds.has(card.id)"
              class="w-5 h-5 rounded cursor-pointer accent-primary-500"
              @change="toggleCard(card.id)"
            />
          </div>

          <!-- Clic sur la carte pour sélectionner en mode sélection -->
          <div
            v-if="selecting"
            class="absolute inset-0 z-[5] cursor-pointer"
            @click="toggleCard(card.id)"
          />

          <!-- Bouton export individuel (hors mode sélection) -->
          <button
            v-if="!selecting"
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
import { ref, computed, reactive } from 'vue'
import { useCardsStore } from '../stores/cards.js'
import CardPreview from './CardPreview.vue'
import { exportCardsToPdf } from '../utils/pdfExport.js'

const store = useCardsStore()

const galleryRef = ref(null)
const exporting = ref(false)
const exportProgress = ref(0)
const exportProgressText = ref('')
const selecting = ref(false)
const selectedIds = reactive(new Set())

const cards = computed(() => store.generatedCards)

const exportLabel = computed(() => {
  if (selecting.value && selectedIds.size > 0) {
    return `Exporter ${selectedIds.size} carte${selectedIds.size > 1 ? 's' : ''}`
  }
  return 'Exporter en PDF'
})

function getCardType(cardTypeId) {
  return store.cardTypes.find((t) => t.id === cardTypeId) || {}
}

function getCardElements() {
  if (!galleryRef.value) return []
  return Array.from(galleryRef.value.querySelectorAll('.card-preview'))
}

// --- Sélection ---

function toggleSelecting() {
  selecting.value = !selecting.value
  selectedIds.clear()
}

function toggleCard(id) {
  if (selectedIds.has(id)) {
    selectedIds.delete(id)
  } else {
    selectedIds.add(id)
  }
}

function toggleAll() {
  if (selectedIds.size === cards.value.length) {
    selectedIds.clear()
  } else {
    cards.value.forEach((c) => selectedIds.add(c.id))
  }
}

// --- Export PDF ---

async function runExport(elements, fileName) {
  exporting.value = true
  exportProgress.value = 0
  exportProgressText.value = `0 / ${elements.length}`

  try {
    await exportCardsToPdf(elements, {
      fileName,
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

function exportPdf() {
  const allElements = getCardElements()
  if (allElements.length === 0) return

  if (selecting.value && selectedIds.size > 0) {
    // Exporter uniquement les cartes sélectionnées
    const selectedElements = cards.value
      .map((card, i) => (selectedIds.has(card.id) ? allElements[i] : null))
      .filter(Boolean)
    runExport(selectedElements, `cartes-selection-${selectedIds.size}.pdf`)
  } else {
    // Exporter toutes les cartes
    runExport(allElements, 'cartes-gachapow.pdf')
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
