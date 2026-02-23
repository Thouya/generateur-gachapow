<template>
  <div class="rounded-[var(--ui-radius)] border border-[var(--ui-border)] bg-[var(--ui-bg)] shadow-sm">
    <!-- Header -->
    <div class="px-4 py-3 border-b border-[var(--ui-border)] flex flex-wrap items-center justify-between gap-2">
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-images" class="text-lg text-[var(--ui-primary)]" />
        <h3 class="text-lg font-semibold">Galerie</h3>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <UBadge v-if="cards.length > 0" color="primary" variant="subtle">
          {{ totalWithQuantities }} carte{{ totalWithQuantities > 1 ? 's' : '' }}
        </UBadge>

        <!-- Regénérer -->
        <UButton
          v-if="store.csvData.length > 0"
          icon="i-lucide-sparkles"
          color="primary"
          variant="soft"
          size="sm"
          :title="cards.length > 0 ? 'Regénérer' : 'Générer'"
          @click="store.generateCards()"
        >
          <span class="hidden sm:inline">{{ cards.length > 0 ? 'Regénérer' : 'Générer' }}</span>
        </UButton>

        <!-- Mode sélection -->
        <UButton
          v-if="cards.length > 0"
          :icon="selecting ? 'i-lucide-x' : 'i-lucide-check-square'"
          color="neutral"
          variant="soft"
          size="sm"
          :disabled="exporting"
          :title="selecting ? 'Annuler' : 'Sélectionner'"
          @click="toggleSelecting"
        >
          <span class="hidden sm:inline">{{ selecting ? 'Annuler' : 'Sélectionner' }}</span>
        </UButton>

        <!-- Export PDF -->
        <UButton
          v-if="cards.length > 0"
          icon="i-lucide-file-down"
          color="primary"
          variant="soft"
          size="sm"
          :loading="exporting"
          :disabled="selecting && selectedIds.size === 0"
          :title="exportLabel"
          @click="exportPdf"
        >
          <span class="hidden sm:inline">{{ exportLabel }}</span>
        </UButton>
      </div>
    </div>

    <div class="p-4">
      <!-- État vide : pas de CSV chargé -->
      <div v-if="store.csvData.length === 0" class="text-center text-[var(--ui-text-dimmed)] py-12">
        <UIcon name="i-lucide-table" class="text-4xl mb-3" />
        <p>Charge d'abord un CSV dans l'onglet <strong>Données</strong>.</p>
      </div>

      <!-- État vide : CSV chargé mais pas encore généré -->
      <div v-else-if="cards.length === 0" class="text-center text-[var(--ui-text-dimmed)] py-12">
        <UIcon name="i-lucide-layers" class="text-4xl mb-3" />
        <p class="mb-4">Aucune carte générée pour ce type.</p>
        <UButton icon="i-lucide-sparkles" color="primary" @click="store.generateCards()">
          Générer les cartes
        </UButton>
      </div>

      <template v-else>
        <!-- Barre de recherche + filtres par colonne -->
        <div class="mb-4 space-y-2">
          <UInput
            v-model="searchQuery"
            placeholder="Rechercher dans toutes les colonnes…"
            icon="i-lucide-search"
            size="sm"
          />
          <div v-if="visibleColumns.length > 0" class="flex flex-wrap items-center gap-1.5">
            <div v-for="col in visibleColumns" :key="col" class="flex items-center gap-1">
              <span class="text-xs text-[var(--ui-text-muted)] whitespace-nowrap hidden sm:inline">{{ col }} :</span>
              <input
                v-model="columnFilters[col]"
                type="text"
                :placeholder="col"
                class="text-xs px-2 py-1 rounded-[var(--ui-radius)] border border-[var(--ui-border)] bg-[var(--ui-bg-elevated)] focus:border-[var(--ui-primary)] outline-none w-[72px] sm:w-[90px]"
              />
            </div>
            <UButton
              v-if="hasActiveFilters"
              size="xs"
              variant="ghost"
              color="neutral"
              icon="i-lucide-x"
              label="Effacer"
              @click="clearFilters"
            />
          </div>
          <div v-if="filteredCards.length !== cards.length" class="text-xs text-[var(--ui-text-dimmed)]">
            {{ filteredCards.length }} / {{ cards.length }} cartes affichées
          </div>
        </div>

        <!-- Barre sélection -->
        <div v-if="selecting" class="pb-3 flex items-center gap-2">
          <UButton
            size="xs"
            variant="ghost"
            :label="selectedIds.size === filteredCards.length ? 'Tout désélectionner' : 'Tout sélectionner'"
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

        <!-- Grille de cartes -->
        <div ref="galleryRef" class="flex flex-wrap gap-3 sm:gap-6">
          <div
            v-for="card in filteredCards"
            :key="card.id"
            class="flex-shrink-0 relative group"
            :class="{
              'ring-3 ring-[var(--ui-primary)] rounded-xl': selecting && selectedIds.has(card.id),
              'cursor-pointer': !selecting,
            }"
            @click="!selecting && openEditPanel(card)"
          >
            <CardPreview :card-type="cardType" :card-data="card.data" />

            <!-- Badge quantité -->
            <div
              v-if="getQuantity(card) > 1 && !selecting"
              class="absolute top-2 left-2 z-10 bg-[var(--ui-primary)] text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow"
            >
              &times;{{ getQuantity(card) }}
            </div>

            <!-- Indicateur note -->
            <div
              v-if="card.data?.__notes?.trim() && !selecting"
              class="absolute bottom-2 right-2 z-10 bg-[var(--ui-bg)]/85 rounded-full p-1.5 shadow-sm"
              title="Cette carte a des notes"
            >
              <UIcon name="i-lucide-notebook-pen" class="text-xs text-[var(--ui-primary)]" />
            </div>

            <!-- Checkbox mode sélection -->
            <div v-if="selecting" class="absolute top-2 left-2 z-10">
              <input
                type="checkbox"
                :checked="selectedIds.has(card.id)"
                class="w-6 h-6 rounded cursor-pointer accent-[var(--ui-primary)]"
                @change="toggleCard(card.id)"
              />
            </div>
            <div
              v-if="selecting"
              class="absolute inset-0 z-[5] cursor-pointer"
              @click="toggleCard(card.id)"
            />

            <!-- Actions hover (mode normal) -->
            <div
              v-if="!selecting"
              class="absolute top-2 right-2 z-10 flex flex-col gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
            >
              <button
                class="bg-[var(--ui-bg)]/80 rounded-full p-1.5 shadow-sm hover:shadow cursor-pointer"
                title="Exporter en PDF"
                :disabled="exporting"
                @click.stop="exportSingleCard(card)"
              >
                <UIcon name="i-lucide-download" class="text-sm" />
              </button>
            </div>
          </div>
        </div>

        <!-- Aucun résultat après filtrage -->
        <div v-if="filteredCards.length === 0" class="text-center text-[var(--ui-text-dimmed)] py-8">
          <UIcon name="i-lucide-search-x" class="text-3xl mb-2" />
          <p>Aucune carte ne correspond aux filtres.</p>
        </div>
      </template>
    </div>
  </div>

  <!-- Panneau d'édition (hors du div principal pour le z-index) -->
  <CardEditPanel
    :card="editingCard"
    :card-type="cardType"
    @close="editingCard = null"
    @saved="editingCard = null"
  />
</template>

<script setup>
import { ref, computed, reactive, watch } from 'vue'
import { useCardsStore } from '../stores/cards.js'
import CardPreview from './CardPreview.vue'
import CardEditPanel from './CardEditPanel.vue'
import { exportCardsToPdf } from '../utils/pdfExport.js'

const store = useCardsStore()

const galleryRef = ref(null)
const exporting = ref(false)
const exportProgress = ref(0)
const exportProgressText = ref('')
const selecting = ref(false)
const selectedIds = reactive(new Set())
const editingCard = ref(null)

// Filtres
const searchQuery = ref('')
const columnFilters = ref({})

// Cartes filtrées par type sélectionné
const cards = computed(() =>
  store.generatedCards.filter((c) => c.cardTypeId === store.selectedCardTypeId)
)

const cardType = computed(() => store.selectedCardType || {})

const visibleColumns = computed(() =>
  store.csvColumns.filter((col) => !col.startsWith('__'))
)

const hasActiveFilters = computed(() =>
  searchQuery.value.trim() !== '' ||
  Object.values(columnFilters.value).some((v) => v && v.trim() !== '')
)

const filteredCards = computed(() => {
  let data = cards.value

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    data = data.filter((card) =>
      visibleColumns.value.some((col) =>
        String(card.data?.[col] ?? '').toLowerCase().includes(q)
      )
    )
  }

  for (const [col, val] of Object.entries(columnFilters.value)) {
    if (val && val.trim()) {
      const f = val.toLowerCase()
      data = data.filter((card) =>
        String(card.data?.[col] ?? '').toLowerCase().includes(f)
      )
    }
  }

  return data
})

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

// Reset sélection si on change de filtre
watch([searchQuery, columnFilters], () => { selectedIds.clear() }, { deep: true })

function clearFilters() {
  searchQuery.value = ''
  columnFilters.value = {}
}

function getQuantity(card) {
  return card.data?.__quantity || 1
}

function openEditPanel(card) {
  editingCard.value = card
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
  if (selectedIds.size === filteredCards.value.length) {
    selectedIds.clear()
  } else {
    filteredCards.value.forEach((c) => selectedIds.add(c.id))
  }
}

// --- Export PDF ---

function getCardElements() {
  if (!galleryRef.value) return []
  return Array.from(galleryRef.value.querySelectorAll('.card-preview'))
}

function getExportElements(filterFn) {
  const allElements = getCardElements()
  const result = []
  filteredCards.value.forEach((card, i) => {
    if (filterFn && !filterFn(card)) return
    const qty = getQuantity(card)
    for (let q = 0; q < qty; q++) {
      result.push(allElements[i])
    }
  })
  return result
}

async function runExport(elements, fileName) {
  if (elements.length === 0) return
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
    runExport(elements, `cartes-selection-${elements.length}.pdf`)
  } else {
    const elements = getExportElements()
    runExport(elements, 'cartes-gachapow.pdf')
  }
}

async function exportSingleCard(card) {
  const idx = filteredCards.value.findIndex((c) => c.id === card.id)
  if (idx === -1) return
  const elements = getCardElements()
  if (!elements[idx]) return

  const qty = getQuantity(card)
  const repeated = Array(qty).fill(elements[idx])
  await runExport(repeated, `carte-${idx + 1}.pdf`)
}
</script>
