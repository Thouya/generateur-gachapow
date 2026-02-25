<template>
  <div class="rounded-[var(--ui-radius)] border border-[var(--ui-border)] bg-[var(--ui-bg)] shadow-sm">
    <div class="px-4 py-3 border-b border-[var(--ui-border)] flex items-center justify-between">
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-file-spreadsheet" class="text-lg text-[var(--ui-primary)]" />
        <h3 class="text-lg font-semibold">Données CSV — {{ store.selectedCardType?.name }}</h3>
      </div>
      <UBadge v-if="store.csvData.length > 0" color="primary" variant="subtle">
        {{ store.csvData.length }} lignes
      </UBadge>
    </div>

    <div class="p-4">
      <!-- Zone d'upload -->
      <div
        v-if="store.csvData.length === 0"
        class="border-2 border-dashed border-[var(--ui-border)] rounded-[var(--ui-radius)] p-4 sm:p-8 text-center hover:border-[var(--ui-primary)] transition-colors cursor-pointer"
        @dragover.prevent
        @drop.prevent="onDrop"
        @click="$refs.fileInput.click()"
      >
        <input
          ref="fileInput"
          type="file"
          accept=".csv"
          class="hidden"
          @change="onFileChange"
        />
        <UIcon name="i-lucide-upload" class="text-4xl text-[var(--ui-text-dimmed)] mb-3" />
        <p class="text-[var(--ui-text-muted)]">Glissez un fichier CSV ici ou cliquez pour parcourir</p>
      </div>

      <!-- Données chargées -->
      <div v-else>
        <div class="flex flex-wrap gap-1 mb-3">
          <UBadge v-for="col in store.csvColumns" :key="col" color="neutral" variant="subtle" size="sm">
            {{ col }}
          </UBadge>
        </div>

        <div class="overflow-x-auto rounded-[var(--ui-radius)] border border-[var(--ui-border)] mb-3">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-[var(--ui-bg-elevated)]">
                <th
                  v-for="col in store.csvColumns"
                  :key="col"
                  class="px-3 py-2 text-left font-medium text-[var(--ui-text-muted)] border-b border-[var(--ui-border)]"
                >
                  {{ col }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(row, i) in previewRows"
                :key="i"
                class="border-b border-[var(--ui-border-accented)]/50 last:border-0"
              >
                <td
                  v-for="col in store.csvColumns"
                  :key="col"
                  class="px-3 py-2 max-w-[150px] truncate"
                >
                  {{ row[col] }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <p v-if="store.csvData.length > 5" class="text-xs text-[var(--ui-text-dimmed)] mb-3">
          … et {{ store.csvData.length - 5 }} autres lignes
        </p>

        <UButton variant="soft" color="error" size="sm" icon="i-lucide-trash-2" @click="clearData">
          Supprimer les données
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useCardsStore } from '../stores/cards.js'
import { useConfirm } from '../composables/useConfirm.js'
import { parseCsvFile } from '../utils/csv.js'

const store = useCardsStore()
const { confirm } = useConfirm()
const fileInput = ref(null)

async function clearData() {
  const ok = await confirm({ title: 'Supprimer les données CSV ?', message: `Les ${store.csvData.length} lignes seront définitivement supprimées.` })
  if (!ok) return
  store.clearCsvData()
}

const previewRows = computed(() => store.csvData.slice(0, 5))

async function handleFile(file) {
  if (!file || !file.name.endsWith('.csv')) return
  const data = await parseCsvFile(file)
  if (data.length > 0) {
    const columns = Object.keys(data[0])
    store.setCsvData(data, columns)
  }
}

function onFileChange(e) {
  handleFile(e.target.files[0])
}

function onDrop(e) {
  handleFile(e.dataTransfer.files[0])
}
</script>
