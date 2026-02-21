import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../utils/supabase.js'
import { loadFromStorage, clearStorage } from '../utils/storage.js'

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

// Sync DB en arrière-plan avec log d'erreur
function db(promise) {
  promise.then((result) => {
    if (result?.error) console.error('[Supabase]', result.error.message)
  })
}

// ── Conversion DB ↔ App ─────────────────────────────
function dbToCardType(row) {
  return {
    id: row.id,
    name: row.name,
    width: row.width,
    height: row.height,
    backgroundImage: row.background_image || '',
    illustrationImage: row.illustration_image || '',
    illustrationColumn: row.illustration_column || '',
    overlayImage: row.overlay_image || '',
    contentFields: row.content_fields || [],
  }
}

function cardTypeToDb(ct, projectId) {
  return {
    id: ct.id,
    project_id: projectId,
    name: ct.name,
    width: ct.width || 300,
    height: ct.height || 420,
    background_image: ct.backgroundImage || '',
    illustration_image: ct.illustrationImage || '',
    illustration_column: ct.illustrationColumn || '',
    overlay_image: ct.overlayImage || '',
    content_fields: ct.contentFields || [],
  }
}

// ── Historique ──────────────────────────────────────
const IMAGE_FIELDS = ['backgroundImage', 'illustrationImage', 'overlayImage']

function makeSnapshot(ct) {
  return {
    name: ct.name,
    width: ct.width,
    height: ct.height,
    hasBackgroundImage: !!ct.backgroundImage,
    hasIllustrationImage: !!ct.illustrationImage,
    hasOverlayImage: !!ct.overlayImage,
    illustrationColumn: ct.illustrationColumn,
    contentFields: ct.contentFields,
  }
}

function computeChanges(oldCt, updates) {
  const changes = {}
  for (const key of Object.keys(updates)) {
    const oldVal = oldCt[key]
    const newVal = updates[key]
    if (IMAGE_FIELDS.includes(key)) {
      if (oldVal !== newVal) {
        changes[key] = { from: oldVal ? '(image)' : '(vide)', to: newVal ? '(image)' : '(vide)' }
      }
    } else if (key === 'contentFields') {
      if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        const oldNames = (oldVal || []).map((f) => f.label || f.column).join(', ')
        const newNames = (newVal || []).map((f) => f.label || f.column).join(', ')
        changes[key] = { from: oldNames || '(aucun)', to: newNames || '(aucun)' }
      }
    } else if (oldVal !== newVal) {
      changes[key] = { from: oldVal, to: newVal }
    }
  }
  return changes
}

// ── Store ───────────────────────────────────────────
export const useCardsStore = defineStore('cards', () => {
  const projects = ref([])
  const selectedProjectId = ref(null)
  const loading = ref(false)
  const cardTypeHistory = ref([])

  // ── Computed ────────────────────────────────────────
  const selectedProject = computed(() =>
    projects.value.find((p) => p.id === selectedProjectId.value) || null
  )
  const cardTypes = computed(() => selectedProject.value?.cardTypes ?? [])
  const csvData = computed(() => selectedProject.value?.csvData ?? [])
  const csvColumns = computed(() => selectedProject.value?.csvColumns ?? [])
  const generatedCards = computed(() => selectedProject.value?.generatedCards ?? [])
  const selectedCardTypeId = computed(() => selectedProject.value?.selectedCardTypeId ?? null)
  const selectedCardType = computed(() =>
    cardTypes.value.find((t) => t.id === selectedCardTypeId.value) || null
  )

  // ── Initialisation ──────────────────────────────────
  async function init() {
    loading.value = true
    try {
      const [{ data: pRows }, { data: ctRows }, { data: gcRows }] = await Promise.all([
        supabase.from('projects').select('*'),
        supabase.from('card_types').select('*'),
        supabase.from('generated_cards').select('*'),
      ])

      if (pRows && pRows.length > 0) {
        projects.value = pRows.map((p) => ({
          id: p.id,
          name: p.name,
          csvData: p.csv_data || [],
          csvColumns: p.csv_columns || [],
          selectedCardTypeId: p.selected_card_type_id,
          cardTypes: (ctRows || []).filter((ct) => ct.project_id === p.id).map(dbToCardType),
          generatedCards: (gcRows || [])
            .filter((c) => c.project_id === p.id)
            .map((c) => ({ id: c.id, cardTypeId: c.card_type_id, data: c.data || {} })),
        }))
      } else {
        await migrateFromLocalStorage()
      }

      selectedProjectId.value =
        localStorage.getItem('gachapow-selected-project') || projects.value[0]?.id || null
    } finally {
      loading.value = false
    }
  }

  async function migrateFromLocalStorage() {
    const saved = loadFromStorage()
    if (!saved) return

    let toMigrate = []
    if (saved.projects) {
      toMigrate = saved.projects
    } else if (saved.cardTypes) {
      toMigrate = [
        {
          id: uid(),
          name: 'Mon projet',
          cardTypes: saved.cardTypes || [],
          csvData: saved.csvData || [],
          csvColumns: saved.csvColumns || [],
          generatedCards: saved.generatedCards || [],
          selectedCardTypeId: saved.selectedCardTypeId || null,
        },
      ]
    }

    for (const p of toMigrate) {
      const { error: pErr } = await supabase.from('projects').insert({
        id: p.id,
        name: p.name,
        csv_data: p.csvData || [],
        csv_columns: p.csvColumns || [],
        selected_card_type_id: p.selectedCardTypeId,
      })
      if (pErr) {
        console.error('[Migration]', pErr.message)
        continue
      }

      if (p.cardTypes?.length) {
        const { error: ctErr } = await supabase
          .from('card_types')
          .insert(p.cardTypes.map((ct) => cardTypeToDb(ct, p.id)))
        if (ctErr) console.error('[Migration card_types]', ctErr.message)
      }

      if (p.generatedCards?.length) {
        const { error: gcErr } = await supabase.from('generated_cards').insert(
          p.generatedCards.map((c) => ({
            id: c.id,
            project_id: p.id,
            card_type_id: c.cardTypeId,
            data: c.data || {},
          }))
        )
        if (gcErr) console.error('[Migration generated_cards]', gcErr.message)
      }
    }

    projects.value = toMigrate
    clearStorage()
  }

  // ── Projets ─────────────────────────────────────────
  function addProject(name) {
    const id = uid()
    const project = {
      id,
      name,
      cardTypes: [],
      csvData: [],
      csvColumns: [],
      generatedCards: [],
      selectedCardTypeId: null,
    }
    projects.value.push(project)
    selectedProjectId.value = id
    localStorage.setItem('gachapow-selected-project', id)
    db(supabase.from('projects').insert({ id, name }))
    return id
  }

  function renameProject(id, name) {
    const p = projects.value.find((proj) => proj.id === id)
    if (!p) return
    p.name = name
    db(supabase.from('projects').update({ name }).eq('id', id))
  }

  function deleteProject(id) {
    projects.value = projects.value.filter((p) => p.id !== id)
    if (selectedProjectId.value === id) {
      selectedProjectId.value = projects.value[0]?.id || null
      localStorage.setItem('gachapow-selected-project', selectedProjectId.value || '')
    }
    db(supabase.from('projects').delete().eq('id', id))
  }

  function selectProject(id) {
    selectedProjectId.value = id
    localStorage.setItem('gachapow-selected-project', id)
  }

  // ── Historique ──────────────────────────────────────
  function recordHistory(cardTypeId, projectId, action, changes, snapshot) {
    const entry = {
      id: uid(),
      cardTypeId,
      action,
      changes,
      snapshot,
      createdAt: new Date().toISOString(),
    }
    // Ajouter en tête si on regarde déjà l'historique de ce type
    if (cardTypeHistory.value.length > 0 && cardTypeHistory.value[0]?.cardTypeId === cardTypeId) {
      cardTypeHistory.value.unshift(entry)
    }
    db(
      supabase.from('card_type_history').insert({
        id: entry.id,
        card_type_id: cardTypeId,
        project_id: projectId,
        action,
        changes,
        snapshot,
        created_at: entry.createdAt,
      })
    )
  }

  async function loadHistory(cardTypeId) {
    const { data, error } = await supabase
      .from('card_type_history')
      .select('*')
      .eq('card_type_id', cardTypeId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[Supabase]', error.message)
      return
    }

    cardTypeHistory.value = (data || []).map((h) => ({
      id: h.id,
      cardTypeId: h.card_type_id,
      action: h.action,
      changes: h.changes || {},
      snapshot: h.snapshot || {},
      createdAt: h.created_at,
    }))
  }

  // ── Types de cartes ─────────────────────────────────
  function addCardType(cardType) {
    if (!selectedProject.value) return null
    const id = uid()
    const ct = { id, ...cardType }
    selectedProject.value.cardTypes.push(ct)
    db(supabase.from('card_types').insert(cardTypeToDb(ct, selectedProject.value.id)))
    recordHistory(id, selectedProject.value.id, 'created', {}, makeSnapshot(ct))
    return id
  }

  function updateCardType(id, updates) {
    if (!selectedProject.value) return
    const idx = selectedProject.value.cardTypes.findIndex((t) => t.id === id)
    if (idx === -1) return

    const oldCt = selectedProject.value.cardTypes[idx]
    const changes = computeChanges(oldCt, updates)

    // Enregistrer l'historique si changements réels
    if (Object.keys(changes).length > 0) {
      recordHistory(
        id,
        selectedProject.value.id,
        'updated',
        changes,
        makeSnapshot({ ...oldCt, ...updates })
      )
    }

    selectedProject.value.cardTypes[idx] = { ...oldCt, ...updates }

    // Conversion camelCase → snake_case pour la DB
    const dbUp = {}
    if ('name' in updates) dbUp.name = updates.name
    if ('width' in updates) dbUp.width = updates.width
    if ('height' in updates) dbUp.height = updates.height
    if ('backgroundImage' in updates) dbUp.background_image = updates.backgroundImage
    if ('illustrationImage' in updates) dbUp.illustration_image = updates.illustrationImage
    if ('illustrationColumn' in updates) dbUp.illustration_column = updates.illustrationColumn
    if ('overlayImage' in updates) dbUp.overlay_image = updates.overlayImage
    if ('contentFields' in updates) dbUp.content_fields = updates.contentFields

    if (Object.keys(dbUp).length > 0) {
      db(supabase.from('card_types').update(dbUp).eq('id', id))
    }
  }

  function deleteCardType(id) {
    if (!selectedProject.value) return
    const ct = selectedProject.value.cardTypes.find((t) => t.id === id)
    if (ct) {
      recordHistory(id, selectedProject.value.id, 'deleted', {}, makeSnapshot(ct))
    }
    selectedProject.value.cardTypes = selectedProject.value.cardTypes.filter((t) => t.id !== id)
    selectedProject.value.generatedCards = selectedProject.value.generatedCards.filter(
      (c) => c.cardTypeId !== id
    )
    if (selectedProject.value.selectedCardTypeId === id) {
      selectedProject.value.selectedCardTypeId =
        selectedProject.value.cardTypes[0]?.id || null
    }
    // CASCADE en DB supprime aussi les generated_cards et l'historique associés
    db(supabase.from('card_types').delete().eq('id', id))
  }

  function selectCardType(id) {
    if (!selectedProject.value) return
    selectedProject.value.selectedCardTypeId = id
    db(
      supabase
        .from('projects')
        .update({ selected_card_type_id: id })
        .eq('id', selectedProject.value.id)
    )
  }

  // ── CSV ─────────────────────────────────────────────
  function setCsvData(data, columns) {
    if (!selectedProject.value) return
    selectedProject.value.csvData = data
    selectedProject.value.csvColumns = columns
    db(
      supabase
        .from('projects')
        .update({ csv_data: data, csv_columns: columns })
        .eq('id', selectedProject.value.id)
    )
  }

  function clearCsvData() {
    if (!selectedProject.value) return
    selectedProject.value.csvData = []
    selectedProject.value.csvColumns = []
    db(
      supabase
        .from('projects')
        .update({ csv_data: [], csv_columns: [] })
        .eq('id', selectedProject.value.id)
    )
  }

  // ── Génération ──────────────────────────────────────
  function generateCards() {
    if (!selectedProject.value || !selectedCardType.value || csvData.value.length === 0) return

    const type = selectedCardType.value
    const projectId = selectedProject.value.id
    const cards = csvData.value.map((row, index) => ({
      id: `${type.id}-${index}`,
      cardTypeId: type.id,
      data: { ...row },
    }))

    // Mise à jour locale
    selectedProject.value.generatedCards = [
      ...selectedProject.value.generatedCards.filter((c) => c.cardTypeId !== type.id),
      ...cards,
    ]

    // Sync DB : supprimer les anciennes + insérer les nouvelles
    syncGenerateCards(type.id, projectId, cards)
  }

  async function syncGenerateCards(typeId, projectId, cards) {
    const { error: delErr } = await supabase
      .from('generated_cards')
      .delete()
      .eq('card_type_id', typeId)
      .eq('project_id', projectId)
    if (delErr) return console.error('[Supabase]', delErr.message)

    if (cards.length > 0) {
      const { error: insErr } = await supabase.from('generated_cards').insert(
        cards.map((c) => ({
          id: c.id,
          project_id: projectId,
          card_type_id: c.cardTypeId,
          data: c.data,
        }))
      )
      if (insErr) console.error('[Supabase]', insErr.message)
    }
  }

  function clearGeneratedCards(cardTypeId) {
    if (!selectedProject.value) return
    const projectId = selectedProject.value.id

    if (cardTypeId) {
      selectedProject.value.generatedCards = selectedProject.value.generatedCards.filter(
        (c) => c.cardTypeId !== cardTypeId
      )
      db(
        supabase
          .from('generated_cards')
          .delete()
          .eq('card_type_id', cardTypeId)
          .eq('project_id', projectId)
      )
    } else {
      selectedProject.value.generatedCards = []
      db(supabase.from('generated_cards').delete().eq('project_id', projectId))
    }
  }

  // ── Reset ───────────────────────────────────────────
  async function resetAll() {
    const ids = projects.value.map((p) => p.id)
    projects.value = []
    selectedProjectId.value = null
    localStorage.removeItem('gachapow-selected-project')

    for (const id of ids) {
      const { error } = await supabase.from('projects').delete().eq('id', id)
      if (error) console.error('[Supabase]', error.message)
    }
  }

  return {
    projects,
    selectedProjectId,
    loading,
    selectedProject,
    cardTypes,
    csvData,
    csvColumns,
    generatedCards,
    selectedCardTypeId,
    selectedCardType,
    init,
    addProject,
    renameProject,
    deleteProject,
    selectProject,
    addCardType,
    updateCardType,
    deleteCardType,
    selectCardType,
    setCsvData,
    clearCsvData,
    generateCards,
    clearGeneratedCards,
    resetAll,
    cardTypeHistory,
    loadHistory,
  }
})
