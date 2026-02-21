<template>
  <div class="csv-uploader">
    <h3>Données CSV</h3>

    <div class="upload-zone" @dragover.prevent @drop.prevent="onDrop">
      <input
        ref="fileInput"
        type="file"
        accept=".csv"
        class="file-input"
        @change="onFileChange"
      />
      <p>Glissez un fichier CSV ici ou <button class="link-btn" @click="$refs.fileInput.click()">parcourir</button></p>
    </div>

    <div v-if="store.csvData.length > 0" class="csv-info">
      <p>{{ store.csvData.length }} lignes chargées</p>
      <p class="csv-columns">Colonnes : {{ store.csvColumns.join(', ') }}</p>

      <div class="csv-table-wrapper">
        <table class="csv-table">
          <thead>
            <tr>
              <th v-for="col in store.csvColumns" :key="col">{{ col }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, i) in previewRows" :key="i">
              <td v-for="col in store.csvColumns" :key="col">{{ row[col] }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p v-if="store.csvData.length > 5" class="csv-more">
        ... et {{ store.csvData.length - 5 }} autres lignes
      </p>

      <button class="btn btn--danger" @click="store.clearCsvData()">Supprimer les données</button>
    </div>
  </div>
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

<style scoped>
.csv-uploader {
  margin-bottom: 1.5rem;
}

.upload-zone {
  border: 2px dashed #888;
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  transition: border-color 0.2s;
  margin-bottom: 1rem;
}

.upload-zone:hover {
  border-color: #4a90d9;
}

.file-input {
  display: none;
}

.link-btn {
  background: none;
  border: none;
  color: #4a90d9;
  cursor: pointer;
  text-decoration: underline;
  font-size: inherit;
}

.csv-info {
  background: #f5f5f5;
  border-radius: 8px;
  padding: 1rem;
}

.csv-columns {
  font-size: 0.85rem;
  color: #666;
  margin-bottom: 0.5rem;
}

.csv-table-wrapper {
  overflow-x: auto;
  margin-bottom: 0.5rem;
}

.csv-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.csv-table th,
.csv-table td {
  border: 1px solid #ddd;
  padding: 0.35rem 0.5rem;
  text-align: left;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.csv-table th {
  background: #e8e8e8;
  font-weight: 600;
}

.csv-more {
  font-size: 0.85rem;
  color: #888;
  margin-bottom: 0.5rem;
}
</style>
