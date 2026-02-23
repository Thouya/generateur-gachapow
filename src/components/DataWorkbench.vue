<template>
  <div class="rounded-[var(--ui-radius)] border border-[var(--ui-border)] bg-[var(--ui-bg)] shadow-sm">
    <div class="px-4 py-3 border-b border-[var(--ui-border)]">
      <div class="flex items-center justify-between gap-3 flex-wrap">
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-table-2" class="text-lg text-[var(--ui-primary)]" />
          <h3 class="text-lg font-semibold">Atelier de données</h3>
        </div>
        <div class="flex items-center gap-2 flex-wrap">
          <UInput
            v-model="searchQuery"
            placeholder="Rechercher…"
            icon="i-lucide-search"
            size="sm"
            class="w-full sm:w-40"
          />
          <UButton
            size="sm"
            variant="soft"
            icon="i-lucide-history"
            :title="`Historique (${editHistory.length})`"
            @click="showHistory = !showHistory"
          >
            <span class="hidden sm:inline">{{ editHistory.length }}</span>
          </UButton>
          <UButton size="sm" variant="soft" icon="i-lucide-plus" @click="addRow">
            <span class="hidden sm:inline">Ligne</span>
          </UButton>
          <UButton
            v-if="!showAddColumn"
            size="sm"
            variant="soft"
            icon="i-lucide-columns-3"
            @click="showAddColumn = true"
          >
            <span class="hidden sm:inline">Colonne</span>
          </UButton>
          <div v-else class="flex items-center gap-1">
            <UInput
              v-model="newColumnName"
              placeholder="Nom…"
              size="sm"
              class="w-24"
              @keyup.enter="addColumn"
            />
            <UButton size="sm" color="primary" icon="i-lucide-check" @click="addColumn" />
            <UButton
              size="sm"
              variant="ghost"
              icon="i-lucide-x"
              @click="showAddColumn = false; newColumnName = ''"
            />
          </div>
        </div>
      </div>
    </div>

    <div class="p-4">
    <!-- Content: table + preview -->
    <div class="flex flex-col lg:flex-row gap-4">
      <!-- Table -->
      <div class="flex-1 min-w-0">
        <div
          class="overflow-x-auto overflow-y-auto max-h-[600px] border rounded-[var(--ui-radius)] border-[var(--ui-border)]"
        >
          <table class="w-full text-sm border-collapse">
            <thead class="sticky top-0 z-10">
              <!-- Header row -->
              <tr class="bg-[var(--ui-bg-elevated)]">
                <th
                  class="px-2 py-2 text-left text-xs font-semibold text-[var(--ui-text-dimmed)] uppercase tracking-wider border-b border-[var(--ui-border)] w-10"
                >
                  #
                </th>
                <th
                  v-for="col in columns"
                  :key="col"
                  class="px-2 py-2 text-left text-xs font-semibold text-[var(--ui-text-dimmed)] uppercase tracking-wider border-b border-[var(--ui-border)] cursor-pointer hover:text-[var(--ui-text)] select-none"
                  @click="toggleSort(col)"
                >
                  <div class="flex items-center gap-1">
                    {{ col }}
                    <span
                      v-if="sortColumn === col"
                      class="text-[var(--ui-primary)]"
                    >{{ sortDirection === 'asc' ? '▲' : '▼' }}</span>
                  </div>
                </th>
                <th
                  class="px-2 py-2 text-left text-xs font-semibold text-[var(--ui-text-dimmed)] uppercase tracking-wider border-b border-[var(--ui-border)] w-16"
                >
                  Qté
                </th>
                <th
                  class="px-2 py-2 border-b border-[var(--ui-border)] w-8"
                />
              </tr>
              <!-- Filter row -->
              <tr class="bg-[var(--ui-bg-elevated)]/50">
                <td class="px-2 py-1 border-b border-[var(--ui-border)]" />
                <td
                  v-for="col in columns"
                  :key="'f-' + col"
                  class="px-1 py-1 border-b border-[var(--ui-border)]"
                >
                  <input
                    v-model="columnFilters[col]"
                    type="text"
                    :placeholder="'Filtrer…'"
                    class="w-full bg-transparent text-xs px-1 py-0.5 outline-none border border-transparent focus:border-[var(--ui-primary)] rounded-[var(--ui-radius)] placeholder:text-[var(--ui-text-dimmed)]"
                  />
                </td>
                <td class="px-2 py-1 border-b border-[var(--ui-border)]" />
                <td class="px-2 py-1 border-b border-[var(--ui-border)]" />
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in paginatedData"
                :key="row._index"
                class="border-b border-[var(--ui-border-accented)]/50 transition-colors"
                :class="selectedRowIndex === row._index
                  ? 'bg-[var(--ui-primary)]/5'
                  : 'hover:bg-[var(--ui-bg-elevated)]/50'"
                @click="selectRow(row._index)"
              >
                <!-- Row number -->
                <td class="px-2 py-1.5 text-xs text-[var(--ui-text-dimmed)] font-mono">
                  {{ row._index + 1 }}
                </td>
                <!-- Data cells -->
                <td
                  v-for="col in columns"
                  :key="col"
                  class="px-2 py-1.5"
                  @dblclick="startEdit(row._index, col)"
                >
                  <!-- Edit mode -->
                  <input
                    v-if="editingCell?.row === row._index && editingCell?.col === col"
                    :value="store.csvData[row._index][col] ?? ''"
                    :ref="el => el && el.focus()"
                    class="w-full bg-[var(--ui-bg)] text-sm px-1 py-0.5 outline-none border border-[var(--ui-primary)] rounded-[var(--ui-radius)] min-w-[60px]"
                    @input="e => handleEditInput(row._index, col, e.target.value)"
                    @blur="saveEdit"
                    @keydown.enter="saveEdit"
                    @keydown.escape="cancelEdit"
                  />
                  <!-- Display mode -->
                  <template v-else>
                    <img
                      v-if="isImageValue(row[col])"
                      :src="row[col]"
                      class="h-8 w-8 object-cover rounded-[var(--ui-radius)]"
                    />
                    <span
                      v-else
                      class="block max-w-[200px] truncate cursor-text text-sm"
                      :title="String(row[col] ?? '')"
                    >{{ row[col] ?? '' }}</span>
                  </template>
                </td>
                <!-- Quantity -->
                <td class="px-2 py-1.5">
                  <input
                    type="number"
                    min="1"
                    :value="store.csvData[row._index].__quantity || 1"
                    class="w-14 bg-[var(--ui-bg)] text-sm text-center px-1 py-0.5 outline-none border border-[var(--ui-border)] focus:border-[var(--ui-primary)] rounded-[var(--ui-radius)]"
                    @change="e => updateQuantity(row._index, e.target.value)"
                  />
                </td>
                <!-- Delete row -->
                <td class="px-1 py-1.5">
                  <UButton
                    size="xs"
                    variant="ghost"
                    color="error"
                    icon="i-lucide-trash-2"
                    @click.stop="deleteRow(row._index)"
                  />
                </td>
              </tr>
              <!-- Empty state -->
              <tr v-if="paginatedData.length === 0">
                <td
                  :colspan="columns.length + 3"
                  class="text-center text-[var(--ui-text-dimmed)] text-sm py-8"
                >
                  {{ store.csvData.length === 0 ? 'Aucune donnée.' : 'Aucun résultat pour ce filtre.' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination + info -->
        <div class="flex items-center justify-between mt-3">
          <span class="text-xs text-[var(--ui-text-dimmed)]">
            {{ filteredData.length }} ligne{{ filteredData.length > 1 ? 's' : '' }}
            <template v-if="filteredData.length !== store.csvData.length">
              sur {{ store.csvData.length }}
            </template>
            · Double-clic pour modifier
          </span>
          <div v-if="totalPages > 1" class="flex items-center gap-1">
            <UButton
              size="xs"
              variant="ghost"
              icon="i-lucide-chevron-left"
              :disabled="currentPage <= 1"
              @click="currentPage--"
            />
            <span class="text-xs text-[var(--ui-text-muted)] min-w-[60px] text-center">
              {{ currentPage }} / {{ totalPages }}
            </span>
            <UButton
              size="xs"
              variant="ghost"
              icon="i-lucide-chevron-right"
              :disabled="currentPage >= totalPages"
              @click="currentPage++"
            />
          </div>
        </div>
      </div>

      <!-- Preview sidebar -->
      <div v-if="store.selectedCardType" class="lg:w-auto shrink-0">
        <div class="lg:sticky lg:top-4 space-y-3">
          <div class="text-sm font-medium text-[var(--ui-text-muted)]">
            Aperçu — Ligne {{ selectedRowIndex + 1 }}
          </div>
          <div
            class="border rounded-[var(--ui-radius)] p-3 bg-[var(--ui-bg-elevated)] flex justify-center"
          >
            <CardPreview
              :card-type="store.selectedCardType"
              :card-data="previewData"
            />
          </div>
          <!-- Row navigation -->
          <div class="flex items-center justify-center gap-2">
            <UButton
              size="xs"
              variant="ghost"
              icon="i-lucide-chevron-left"
              :disabled="selectedRowIndex <= 0"
              @click="prevRow"
            />
            <span class="text-sm text-[var(--ui-text-muted)] min-w-[60px] text-center">
              {{ selectedRowIndex + 1 }} / {{ store.csvData.length }}
            </span>
            <UButton
              size="xs"
              variant="ghost"
              icon="i-lucide-chevron-right"
              :disabled="selectedRowIndex >= store.csvData.length - 1"
              @click="nextRow"
            />
          </div>
          <!-- Generate button -->
          <UButton
            color="primary"
            icon="i-lucide-sparkles"
            block
            size="sm"
            @click="store.generateCards()"
          >
            Générer les cartes
          </UButton>
          <div v-if="generatedCountForType > 0" class="text-xs text-center text-[var(--ui-text-dimmed)]">
            {{ generatedCountForType }} carte{{ generatedCountForType > 1 ? 's' : '' }} générée{{ generatedCountForType > 1 ? 's' : '' }}
          </div>
        </div>
      </div>
    </div>

    <!-- History panel -->
    <div
      v-if="showHistory"
      class="mt-4 rounded-[var(--ui-radius)] border border-[var(--ui-border)] bg-[var(--ui-bg-elevated)]"
    >
      <div class="px-3 py-2 border-b border-[var(--ui-border)] flex items-center justify-between">
        <h4 class="text-sm font-semibold">Historique des modifications</h4>
        <UButton
          v-if="editHistory.length > 0"
          size="xs"
          variant="ghost"
          color="error"
          @click="editHistory = []"
        >
          Vider
        </UButton>
      </div>

      <div class="p-3">
        <div
          v-if="editHistory.length === 0"
          class="text-sm text-[var(--ui-text-dimmed)] text-center py-4"
        >
          Aucune modification pour cette session.
        </div>
        <div v-else class="space-y-1 max-h-48 overflow-y-auto">
          <div
            v-for="(entry, i) in reversedHistory"
            :key="i"
            class="flex items-center justify-between text-xs bg-[var(--ui-bg)] rounded-[var(--ui-radius)] px-3 py-2 gap-3"
          >
            <span class="text-[var(--ui-text-muted)]">
              <strong class="text-[var(--ui-text)]">Ligne {{ entry.rowIndex + 1 }}</strong>,
              « {{ entry.column }} » :
              <span class="line-through text-red-400">{{ entry.oldValue || '(vide)' }}</span>
              →
              <span class="text-green-500">{{ entry.newValue || '(vide)' }}</span>
            </span>
            <UButton
              size="xs"
              variant="ghost"
              icon="i-lucide-undo-2"
              @click="undoEdit(editHistory.length - 1 - i)"
            />
          </div>
        </div>
      </div>
    </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useCardsStore } from '../stores/cards.js'
import CardPreview from './CardPreview.vue'

const store = useCardsStore()

// ── State ────────────────────────────────────────────
const searchQuery = ref('')
const columnFilters = ref({})
const sortColumn = ref(null)
const sortDirection = ref('asc')
const selectedRowIndex = ref(0)
const editingCell = ref(null)
const editOldValue = ref(null)
const editHistory = ref([])
const showHistory = ref(false)
const showAddColumn = ref(false)
const newColumnName = ref('')
const currentPage = ref(1)
const PAGE_SIZE = 20

// ── Computed ─────────────────────────────────────────
const columns = computed(() => store.csvColumns)

const filteredData = computed(() => {
  let data = store.csvData.map((row, i) => ({ ...row, _index: i }))

  // Recherche globale
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    data = data.filter((row) =>
      columns.value.some((col) =>
        String(row[col] ?? '')
          .toLowerCase()
          .includes(q)
      )
    )
  }

  // Filtres par colonne
  for (const [col, val] of Object.entries(columnFilters.value)) {
    if (val) {
      const f = val.toLowerCase()
      data = data.filter((row) =>
        String(row[col] ?? '')
          .toLowerCase()
          .includes(f)
      )
    }
  }

  // Tri
  if (sortColumn.value) {
    const col = sortColumn.value
    const dir = sortDirection.value === 'asc' ? 1 : -1
    data.sort((a, b) => {
      const va = a[col]
      const vb = b[col]
      const na = Number(va)
      const nb = Number(vb)
      if (!isNaN(na) && !isNaN(nb) && va !== '' && vb !== '') return (na - nb) * dir
      return String(va ?? '').localeCompare(String(vb ?? '')) * dir
    })
  }

  return data
})

const totalPages = computed(() => Math.ceil(filteredData.value.length / PAGE_SIZE))

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return filteredData.value.slice(start, start + PAGE_SIZE)
})

const previewData = computed(() => {
  if (store.csvData.length === 0) return {}
  const idx = Math.min(selectedRowIndex.value, store.csvData.length - 1)
  return store.csvData[idx] ?? {}
})

const reversedHistory = computed(() => [...editHistory.value].reverse())

const generatedCountForType = computed(() => {
  if (!store.selectedCardType) return 0
  return store.generatedCards.filter(
    (c) => c.cardTypeId === store.selectedCardType.id
  ).length
})

// Reset page quand les filtres changent
watch([searchQuery, columnFilters], () => { currentPage.value = 1 }, { deep: true })

// ── Table ────────────────────────────────────────────
function toggleSort(col) {
  if (sortColumn.value === col) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortColumn.value = col
    sortDirection.value = 'asc'
  }
}

function selectRow(index) {
  selectedRowIndex.value = index
}

// ── Édition de cellule ───────────────────────────────
function startEdit(rowIndex, col) {
  editingCell.value = { row: rowIndex, col }
  editOldValue.value = store.csvData[rowIndex]?.[col] ?? ''
  selectedRowIndex.value = rowIndex
}

function handleEditInput(rowIndex, col, value) {
  const ct = store.selectedCardType
  if (ct) ct.csvData[rowIndex][col] = value
}

function saveEdit() {
  if (!editingCell.value) return
  const { row, col } = editingCell.value
  const newValue = store.csvData[row]?.[col] ?? ''
  const oldValue = editOldValue.value

  if (String(oldValue) !== String(newValue)) {
    editHistory.value.push({
      rowIndex: row,
      column: col,
      oldValue,
      newValue,
      timestamp: new Date(),
    })
    store.syncCsvCell(row)
  }

  editingCell.value = null
  editOldValue.value = null
}

function cancelEdit() {
  if (!editingCell.value) return
  const { row, col } = editingCell.value
  const ct = store.selectedCardType
  if (ct) ct.csvData[row][col] = editOldValue.value
  editingCell.value = null
  editOldValue.value = null
}

function undoEdit(historyIndex) {
  const entry = editHistory.value[historyIndex]
  if (!entry) return
  const ct = store.selectedCardType
  if (ct && entry.rowIndex < ct.csvData.length) {
    ct.csvData[entry.rowIndex][entry.column] = entry.oldValue
    store.syncCsvCell(entry.rowIndex)
  }
  editHistory.value.splice(historyIndex, 1)
}

// ── Lignes & Colonnes ────────────────────────────────
function addRow() {
  store.addCsvRow()
  selectedRowIndex.value = store.csvData.length - 1
  currentPage.value = Math.ceil(store.csvData.length / PAGE_SIZE)
}

function deleteRow(rowIndex) {
  if (!window.confirm(`Supprimer la ligne ${rowIndex + 1} ?`)) return
  store.deleteCsvRow(rowIndex)
  if (selectedRowIndex.value >= store.csvData.length) {
    selectedRowIndex.value = Math.max(0, store.csvData.length - 1)
  }
}

function addColumn() {
  const name = newColumnName.value.trim()
  if (!name) return
  store.addCsvColumn(name)
  newColumnName.value = ''
  showAddColumn.value = false
}

// ── Quantité ────────────────────────────────────────
function updateQuantity(rowIndex, value) {
  const qty = Math.max(1, parseInt(value) || 1)
  const ct = store.selectedCardType
  if (!ct) return
  ct.csvData[rowIndex].__quantity = qty
  store.syncCsvCell(rowIndex)
}

// ── Navigation preview ───────────────────────────────
function prevRow() {
  if (selectedRowIndex.value > 0) selectedRowIndex.value--
}

function nextRow() {
  if (selectedRowIndex.value < store.csvData.length - 1) selectedRowIndex.value++
}

// ── Utilitaires ──────────────────────────────────────
function isImageValue(val) {
  if (!val) return false
  const s = String(val)
  return (
    s.startsWith('data:image/') ||
    /\.(png|jpg|jpeg|gif|svg|webp)(\?.*)?$/i.test(s)
  )
}
</script>
