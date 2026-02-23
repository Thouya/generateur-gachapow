<template>
  <UCard>
    <template #header>
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-layers" class="text-lg text-[var(--ui-primary)]" />
          <h3 class="text-lg font-semibold">Cartes générées</h3>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <UBadge v-if="cards.length > 0" color="primary" variant="subtle">
            {{ totalWithQuantities }} carte{{ totalWithQuantities > 1 ? 's' : '' }}
          </UBadge>

          <!-- Bouton mode sélection -->
          <UButton
            v-if="cards.length > 0"
            :icon="selecting ? 'i-lucide-x' : 'i-lucide-check-square'"
            :label="selecting ? 'Annuler' : 'Sélectionner'"
            color="neutral"
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

    <div v-if="cards.length === 0" class="text-center text-[var(--ui-text-dimmed)] py-8">
      <UIcon name="i-lucide-layers" class="text-4xl mb-3" />
      <p>Aucune carte générée. Sélectionne un type de carte, charge un CSV, puis clique sur "Générer".</p>
    </div>

    <template v-else>
      <!-- Barre sélection -->
      <div v-if="selecting" class="pb-3 flex items-center gap-2">
        <UButton
          size="xs"
          variant="ghost"
          :label="selectedIds.size === cards.length ? 'Tout désélectionner' : 'Tout sélectionner'"
          @click="toggleAll"
        />
        <span v-if="selectedIds.size > 0" class="text-sm text-[var(--ui-text-muted)]">
          {{ selectedIds.size }} sélectionnée{{ selectedIds.size > 1 ? 's' : '' }}
        </span>
      </div>

      <!-- Barre de progression export -->
      <div v-if="exporting" class="pb-3">
        <div class="flex items-center gap-3">
          <UProgress :value="exportProgress" class="flex-1" />
          <span class="text-sm text-[var(--ui-text-muted)] whitespace-nowrap">{{ exportProgressText }}</span>
        </div>
      </div>

      <div ref="galleryRef" class="flex flex-wrap gap-3 sm:gap-6">
        <div
          v-for="(card, index) in cards"
          :key="card.id"
          class="flex-shrink-0 relative group"
          :class="{ 'ring-3 ring-[var(--ui-primary)] rounded-xl': selecting && selectedIds.has(card.id) }"
        >
          <CardPreview :card-type="getCardType(card.cardTypeId)" :card-data="card.data" />

          <!-- Badge quantité -->
          <div
            v-if="getQuantity(card) > 1 && !selecting"
            class="absolute top-2 left-2 z-10 bg-[var(--ui-primary)] text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow"
          >
            &times;{{ getQuantity(card) }}
          </div>

          <!-- Checkbox en mode sélection -->
          <div
            v-if="selecting"
            class="absolute top-2 left-2 z-10"
          >
            <input
              type="checkbox"
              :checked="selectedIds.has(card.id)"
              class="w-6 h-6 rounded cursor-pointer accent-[var(--ui-primary)]"
              @change="toggleCard(card.id)"
            />
          </div>

          <!-- Clic sur la carte pour sélectionner en mode sélection -->
          <div
            v-if="selecting"
            class="absolute inset-0 z-[5] cursor-pointer"
            @click="toggleCard(card.id)"
          />

          <!-- Bouton export individuel -->
          <button
            v-if="!selecting"
            class="absolute top-2 right-2 z-10 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity bg-[var(--ui-bg)]/80 rounded-full p-2 shadow-sm hover:shadow cursor-pointer"
            title="Exporter cette carte en PDF"
            :disabled="exporting"
            @click="exportSingleCard(index)"
          >
            <UIcon name="i-lucide-download" />
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

const totalWithQuantities = computed(() =>
  cards.value.reduce((sum, c) => sum + (c.data?.__quantity || 1), 0)
)

const exportLabel = computed(() => {
  if (selecting.value && selectedIds.size > 0) {
    const selTotal = cards.value
      .filter((c) => selectedIds.has(c.id))
      .reduce((sum, c) => sum + (c.data?.__quantity || 1), 0)
    return `Exporter ${selTotal} carte${selTotal > 1 ? 's' : ''}`
  }
  return 'Exporter en PDF'
})

function getCardType(cardTypeId) {
  return store.cardTypes.find((t) => t.id === cardTypeId) || {}
}

function getQuantity(card) {
  return card.data?.__quantity || 1
}

function getCardElements() {
  if (!galleryRef.value) return []
  return Array.from(galleryRef.value.querySelectorAll('.card-preview'))
}

function getExportElements(filterFn) {
  const allElements = getCardElements()
  const result = []
  cards.value.forEach((card, i) => {
    if (filterFn && !filterFn(card)) return
    const qty = getQuantity(card)
    for (let q = 0; q < qty; q++) {
      result.push(allElements[i])
    }
  })
  return result
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
  if (selecting.value && selectedIds.size > 0) {
    const elements = getExportElements((card) => selectedIds.has(card.id))
    if (elements.length === 0) return
    runExport(elements, `cartes-selection-${elements.length}.pdf`)
  } else {
    const elements = getExportElements()
    if (elements.length === 0) return
    runExport(elements, 'cartes-gachapow.pdf')
  }
}

async function exportSingleCard(index) {
  const elements = getCardElements()
  if (!elements[index]) return

  const card = cards.value[index]
  const qty = card ? getQuantity(card) : 1
  const repeated = Array(qty).fill(elements[index])

  exporting.value = true
  exportProgress.value = 0
  exportProgressText.value = `0 / ${repeated.length}`

  try {
    await exportCardsToPdf(repeated, {
      fileName: `carte-${index + 1}.pdf`,
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
</script>
