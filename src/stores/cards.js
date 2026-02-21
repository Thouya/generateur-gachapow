import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { loadFromStorage, saveToStorage } from '../utils/storage.js'

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

export const useCardsStore = defineStore('cards', () => {
  // ── State ──────────────────────────────────────────
  const projects = ref([])
  const selectedProjectId = ref(null)

  // ── Computed: projet actif ─────────────────────────
  const selectedProject = computed(() =>
    projects.value.find((p) => p.id === selectedProjectId.value) || null
  )

  // ── Computed: raccourcis vers le projet actif ──────
  // Les composants existants continuent d'utiliser store.cardTypes, etc.
  const cardTypes = computed(() => selectedProject.value?.cardTypes ?? [])
  const csvData = computed(() => selectedProject.value?.csvData ?? [])
  const csvColumns = computed(() => selectedProject.value?.csvColumns ?? [])
  const generatedCards = computed(() => selectedProject.value?.generatedCards ?? [])
  const selectedCardTypeId = computed(() => selectedProject.value?.selectedCardTypeId ?? null)
  const selectedCardType = computed(() =>
    cardTypes.value.find((t) => t.id === selectedCardTypeId.value) || null
  )

  // ── Initialisation & persistence ──────────────────
  function init() {
    const saved = loadFromStorage()
    if (!saved) return

    if (saved.projects) {
      // Format actuel
      projects.value = saved.projects
      selectedProjectId.value = saved.selectedProjectId || null
    } else if (saved.cardTypes) {
      // Migration depuis l'ancien format (sans projets)
      const defaultProject = {
        id: uid(),
        name: 'Mon projet',
        cardTypes: saved.cardTypes || [],
        csvData: saved.csvData || [],
        csvColumns: saved.csvColumns || [],
        generatedCards: saved.generatedCards || [],
        selectedCardTypeId: saved.selectedCardTypeId || null,
      }
      projects.value = [defaultProject]
      selectedProjectId.value = defaultProject.id
      persist()
    }
  }

  function persist() {
    saveToStorage({
      projects: projects.value,
      selectedProjectId: selectedProjectId.value,
    })
  }

  // ── Gestion des projets ───────────────────────────
  function addProject(name) {
    const id = uid()
    projects.value.push({
      id,
      name,
      cardTypes: [],
      csvData: [],
      csvColumns: [],
      generatedCards: [],
      selectedCardTypeId: null,
    })
    selectedProjectId.value = id
    persist()
    return id
  }

  function renameProject(id, name) {
    const project = projects.value.find((p) => p.id === id)
    if (project) {
      project.name = name
      persist()
    }
  }

  function deleteProject(id) {
    projects.value = projects.value.filter((p) => p.id !== id)
    if (selectedProjectId.value === id) {
      selectedProjectId.value = projects.value[0]?.id || null
    }
    persist()
  }

  function selectProject(id) {
    selectedProjectId.value = id
    persist()
  }

  // ── Gestion des types de cartes (projet actif) ────
  function addCardType(cardType) {
    if (!selectedProject.value) return null
    const id = uid()
    selectedProject.value.cardTypes.push({ id, ...cardType })
    persist()
    return id
  }

  function updateCardType(id, updates) {
    if (!selectedProject.value) return
    const index = selectedProject.value.cardTypes.findIndex((t) => t.id === id)
    if (index !== -1) {
      selectedProject.value.cardTypes[index] = {
        ...selectedProject.value.cardTypes[index],
        ...updates,
      }
      persist()
    }
  }

  function deleteCardType(id) {
    if (!selectedProject.value) return
    selectedProject.value.cardTypes = selectedProject.value.cardTypes.filter((t) => t.id !== id)
    selectedProject.value.generatedCards = selectedProject.value.generatedCards.filter(
      (c) => c.cardTypeId !== id
    )
    if (selectedProject.value.selectedCardTypeId === id) {
      selectedProject.value.selectedCardTypeId =
        selectedProject.value.cardTypes[0]?.id || null
    }
    persist()
  }

  function selectCardType(id) {
    if (!selectedProject.value) return
    selectedProject.value.selectedCardTypeId = id
    persist()
  }

  // ── Gestion CSV (projet actif) ────────────────────
  function setCsvData(data, columns) {
    if (!selectedProject.value) return
    selectedProject.value.csvData = data
    selectedProject.value.csvColumns = columns
    persist()
  }

  function clearCsvData() {
    if (!selectedProject.value) return
    selectedProject.value.csvData = []
    selectedProject.value.csvColumns = []
    persist()
  }

  // ── Génération de cartes (projet actif) ───────────
  function generateCards() {
    if (!selectedProject.value || !selectedCardType.value || csvData.value.length === 0) return

    const type = selectedCardType.value
    const cards = csvData.value.map((row, index) => ({
      id: `${type.id}-${index}`,
      cardTypeId: type.id,
      data: { ...row },
    }))

    selectedProject.value.generatedCards = [
      ...selectedProject.value.generatedCards.filter((c) => c.cardTypeId !== type.id),
      ...cards,
    ]
    persist()
  }

  function clearGeneratedCards(cardTypeId) {
    if (!selectedProject.value) return
    if (cardTypeId) {
      selectedProject.value.generatedCards = selectedProject.value.generatedCards.filter(
        (c) => c.cardTypeId !== cardTypeId
      )
    } else {
      selectedProject.value.generatedCards = []
    }
    persist()
  }

  // ── Reset global ──────────────────────────────────
  function resetAll() {
    projects.value = []
    selectedProjectId.value = null
    persist()
  }

  return {
    // State
    projects,
    selectedProjectId,
    // Computed
    selectedProject,
    cardTypes,
    csvData,
    csvColumns,
    generatedCards,
    selectedCardTypeId,
    selectedCardType,
    // Actions - projets
    init,
    addProject,
    renameProject,
    deleteProject,
    selectProject,
    // Actions - card types
    addCardType,
    updateCardType,
    deleteCardType,
    selectCardType,
    // Actions - CSV
    setCsvData,
    clearCsvData,
    // Actions - génération
    generateCards,
    clearGeneratedCards,
    // Actions - global
    resetAll,
  }
})
