<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold">Données CSV</h3>
        <UBadge v-if="store.csvData.length > 0" color="primary" variant="subtle">
          {{ store.csvData.length }} lignes
        </UBadge>
      </div>
    </template>

    <!-- Zone d'upload -->
    <div
      v-if="store.csvData.length === 0"
      class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 sm:p-8 text-center hover:border-primary-500 transition-colors cursor-pointer"
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
      <UIcon name="i-lucide-file-spreadsheet" class="text-4xl text-gray-400 mb-3" />
      <p class="text-gray-500">Glissez un fichier CSV ici ou cliquez pour parcourir</p>
    </div>

    <!-- Données chargées -->
    <div v-else>
      <div class="flex flex-wrap gap-1 mb-3">
        <UBadge v-for="col in store.csvColumns" :key="col" color="neutral" variant="subtle" size="sm">
          {{ col }}
        </UBadge>
      </div>

      <div class="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 mb-3">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-gray-50 dark:bg-gray-800">
              <th
                v-for="col in store.csvColumns"
                :key="col"
                class="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700"
              >
                {{ col }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(row, i) in previewRows"
              :key="i"
              class="border-b border-gray-100 dark:border-gray-800 last:border-0"
            >
              <td
                v-for="col in store.csvColumns"
                :key="col"
                class="px-3 py-2 max-w-[150px] truncate text-gray-700 dark:text-gray-300"
              >
                {{ row[col] }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p v-if="store.csvData.length > 5" class="text-xs text-gray-400 mb-3">
        ... et {{ store.csvData.length - 5 }} autres lignes
      </p>

      <UButton variant="soft" color="error" size="sm" icon="i-lucide-trash-2" @click="store.clearCsvData()">
        Supprimer les données
      </UButton>
    </div>
  </UCard>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useCardsStore } from '../stores/cards.js'
import { parseCsvFile } from '../utils/csv.js'

const store = useCardsStore()
const fileInput = ref(null)

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
