import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { loadFromStorage, saveToStorage } from '../utils/storage.js'

export const useCardsStore = defineStore('cards', () => {
  // Card types define the visual layers for each type of card
  // Each card type has: name, background image, overlay image, content fields
  const cardTypes = ref([])

  // Raw CSV data rows
  const csvData = ref([])
  const csvColumns = ref([])

  // Generated cards (type + data combined)
  const generatedCards = ref([])

  // Currently selected card type
  const selectedCardTypeId = ref(null)

  const selectedCardType = computed(() =>
    cardTypes.value.find((t) => t.id === selectedCardTypeId.value) || null
  )

  // Initialize from localStorage
  function init() {
    const saved = loadFromStorage()
    if (saved) {
      cardTypes.value = saved.cardTypes || []
      csvData.value = saved.csvData || []
      csvColumns.value = saved.csvColumns || []
      generatedCards.value = saved.generatedCards || []
      selectedCardTypeId.value = saved.selectedCardTypeId || null
    }
  }

  function persist() {
    saveToStorage({
      cardTypes: cardTypes.value,
      csvData: csvData.value,
      csvColumns: csvColumns.value,
      generatedCards: generatedCards.value,
      selectedCardTypeId: selectedCardTypeId.value,
    })
  }

  // Card type management
  function addCardType(cardType) {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
    cardTypes.value.push({ id, ...cardType })
    persist()
    return id
  }

  function updateCardType(id, updates) {
    const index = cardTypes.value.findIndex((t) => t.id === id)
    if (index !== -1) {
      cardTypes.value[index] = { ...cardTypes.value[index], ...updates }
      persist()
    }
  }

  function deleteCardType(id) {
    cardTypes.value = cardTypes.value.filter((t) => t.id !== id)
    generatedCards.value = generatedCards.value.filter((c) => c.cardTypeId !== id)
    if (selectedCardTypeId.value === id) {
      selectedCardTypeId.value = cardTypes.value[0]?.id || null
    }
    persist()
  }

  function selectCardType(id) {
    selectedCardTypeId.value = id
    persist()
  }

  // CSV data management
  function setCsvData(data, columns) {
    csvData.value = data
    csvColumns.value = columns
    persist()
  }

  function clearCsvData() {
    csvData.value = []
    csvColumns.value = []
    persist()
  }

  // Card generation
  function generateCards() {
    if (!selectedCardType.value || csvData.value.length === 0) return

    const type = selectedCardType.value
    const cards = csvData.value.map((row, index) => ({
      id: `${type.id}-${index}`,
      cardTypeId: type.id,
      data: { ...row },
    }))

    // Replace cards for this type
    generatedCards.value = [
      ...generatedCards.value.filter((c) => c.cardTypeId !== type.id),
      ...cards,
    ]
    persist()
  }

  function clearGeneratedCards(cardTypeId) {
    if (cardTypeId) {
      generatedCards.value = generatedCards.value.filter((c) => c.cardTypeId !== cardTypeId)
    } else {
      generatedCards.value = []
    }
    persist()
  }

  function resetAll() {
    cardTypes.value = []
    csvData.value = []
    csvColumns.value = []
    generatedCards.value = []
    selectedCardTypeId.value = null
    persist()
  }

  return {
    cardTypes,
    csvData,
    csvColumns,
    generatedCards,
    selectedCardTypeId,
    selectedCardType,
    init,
    addCardType,
    updateCardType,
    deleteCardType,
    selectCardType,
    setCsvData,
    clearCsvData,
    generateCards,
    clearGeneratedCards,
    resetAll,
  }
})
