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
    illustrationPosition: row.illustration_position ?? null,
    overlayImage: row.overlay_image || '',
    contentFields: row.content_fields || [],
    csvData: row.csv_data || [],
    csvColumns: row.csv_columns || [],
  }
}

function cardTypeToDb(ct, projectId) {
  const row = {
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
    csv_data: ct.csvData || [],
    csv_columns: ct.csvColumns || [],
  }
  // Inclure seulement si la valeur est renseignée (la colonne peut ne pas exister encore en DB)
  if (ct.illustrationPosition != null) row.illustration_position = ct.illustrationPosition
  return row
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
    } else if (key === 'csvData' || key === 'csvColumns') {
      // pas de suivi historique pour les données CSV
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
  const userId = ref(null)

  // ── Computed ────────────────────────────────────────
  const selectedProject = computed(() =>
    projects.value.find((p) => p.id === selectedProjectId.value) || null
  )
  const cardTypes = computed(() => selectedProject.value?.cardTypes ?? [])
  const generatedCards = computed(() => selectedProject.value?.generatedCards ?? [])
  const selectedCardTypeId = computed(() => selectedProject.value?.selectedCardTypeId ?? null)
  const selectedCardType = computed(() =>
    cardTypes.value.find((t) => t.id === selectedCardTypeId.value) || null
  )

  // CSV : au niveau du type de carte sélectionné
  const csvData = computed(() => selectedCardType.value?.csvData ?? [])
  const csvColumns = computed(() => selectedCardType.value?.csvColumns ?? [])

  // Matériel : au niveau du projet sélectionné
  const materials = computed(() => selectedProject.value?.materials ?? [])

  // ── Initialisation ──────────────────────────────────
  async function init() {
    loading.value = true
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      userId.value = session?.user?.id || null

      const [{ data: pRows }, { data: ctRows }, { data: gcRows }] = await Promise.all([
        supabase.from('projects').select('*'),
        supabase.from('card_types').select('*'),
        supabase.from('generated_cards').select('*'),
      ])

      if (pRows && pRows.length > 0) {
        projects.value = pRows.map((p) => ({
          id: p.id,
          name: p.name,
          rules: p.rules || '',
          materials: p.materials || [],
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
          generatedCards: saved.generatedCards || [],
          selectedCardTypeId: saved.selectedCardTypeId || null,
        },
      ]
    }

    for (const p of toMigrate) {
      const { error: pErr } = await supabase.from('projects').insert({
        id: p.id,
        name: p.name,
        user_id: userId.value,
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

    projects.value = toMigrate.map((p) => ({ ...p, csvData: undefined, csvColumns: undefined }))
    clearStorage()
  }

  // ── Projets ─────────────────────────────────────────
  function addProject(name) {
    const id = uid()
    const project = {
      id,
      name,
      rules: '',
      materials: [],
      cardTypes: [],
      generatedCards: [],
      selectedCardTypeId: null,
    }
    projects.value.push(project)
    selectedProjectId.value = id
    localStorage.setItem('gachapow-selected-project', id)
    db(supabase.from('projects').insert({ id, name, user_id: userId.value, rules: '', materials: [] }))
    return id
  }

  function updateProjectRules(id, rules) {
    const p = projects.value.find((proj) => proj.id === id)
    if (!p) return
    p.rules = rules
    db(supabase.from('projects').update({ rules }).eq('id', id))
  }

  // ── Matériel ────────────────────────────────────────
  function addMaterial() {
    const p = selectedProject.value
    if (!p) return null
    const id = uid()
    const item = { id, name: 'Nouvel élément', quantity: 1, description: '', notes: '', files: [] }
    p.materials = [...(p.materials || []), item]
    db(supabase.from('projects').update({ materials: p.materials }).eq('id', p.id))
    return id
  }

  function updateMaterial(id, updates) {
    const p = selectedProject.value
    if (!p) return
    const idx = (p.materials || []).findIndex((m) => m.id === id)
    if (idx === -1) return
    p.materials[idx] = { ...p.materials[idx], ...updates }
    db(supabase.from('projects').update({ materials: p.materials }).eq('id', p.id))
  }

  function deleteMaterial(id) {
    const p = selectedProject.value
    if (!p) return
    const item = (p.materials || []).find((m) => m.id === id)
    if (item?.files?.length) {
      item.files.forEach((f) => {
        supabase.storage.from('materials').remove([f.path])
      })
    }
    p.materials = (p.materials || []).filter((m) => m.id !== id)
    db(supabase.from('projects').update({ materials: p.materials }).eq('id', p.id))
  }

  async function uploadMaterialFile(materialId, file) {
    const p = selectedProject.value
    if (!p) return { error: 'No project' }
    const path = `${p.id}/${materialId}/${Date.now()}-${file.name}`
    const { error } = await supabase.storage.from('materials').upload(path, file)
    if (error) return { error }
    const { data: { publicUrl } } = supabase.storage.from('materials').getPublicUrl(path)
    const fileEntry = { name: file.name, url: publicUrl, path, size: file.size, type: file.type }
    const idx = (p.materials || []).findIndex((m) => m.id === materialId)
    if (idx === -1) return { error: 'Material not found' }
    p.materials[idx].files = [...(p.materials[idx].files || []), fileEntry]
    db(supabase.from('projects').update({ materials: p.materials }).eq('id', p.id))
    return { data: fileEntry }
  }

  async function deleteMaterialFile(materialId, filePath) {
    const p = selectedProject.value
    if (!p) return
    await supabase.storage.from('materials').remove([filePath])
    const idx = (p.materials || []).findIndex((m) => m.id === materialId)
    if (idx === -1) return
    p.materials[idx].files = (p.materials[idx].files || []).filter((f) => f.path !== filePath)
    db(supabase.from('projects').update({ materials: p.materials }).eq('id', p.id))
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
    const ct = { id, csvData: [], csvColumns: [], ...cardType }
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

    const dbUp = {}
    if ('name' in updates) dbUp.name = updates.name
    if ('width' in updates) dbUp.width = updates.width
    if ('height' in updates) dbUp.height = updates.height
    if ('backgroundImage' in updates) dbUp.background_image = updates.backgroundImage
    if ('illustrationImage' in updates) dbUp.illustration_image = updates.illustrationImage
    if ('illustrationColumn' in updates) dbUp.illustration_column = updates.illustrationColumn
    // Inclure seulement si non-null (la colonne peut ne pas exister encore en DB)
    if ('illustrationPosition' in updates && updates.illustrationPosition != null) {
      dbUp.illustration_position = updates.illustrationPosition
    }
    if ('overlayImage' in updates) dbUp.overlay_image = updates.overlayImage
    if ('contentFields' in updates) dbUp.content_fields = updates.contentFields
    if ('csvData' in updates) dbUp.csv_data = updates.csvData
    if ('csvColumns' in updates) dbUp.csv_columns = updates.csvColumns

    if (Object.keys(dbUp).length > 0) {
      db(supabase.from('card_types').update(dbUp).eq('id', id))
    }
  }

  function duplicateCardType(id) {
    if (!selectedProject.value) return null
    const source = selectedProject.value.cardTypes.find((t) => t.id === id)
    if (!source) return null

    const newId = uid()
    const copy = {
      ...JSON.parse(JSON.stringify(source)), // deep copy (images incluses)
      id: newId,
      name: `Copie de ${source.name}`,
      csvData: [],
      csvColumns: [],
    }
    selectedProject.value.cardTypes.push(copy)
    db(supabase.from('card_types').insert(cardTypeToDb(copy, selectedProject.value.id)))
    recordHistory(newId, selectedProject.value.id, 'created', {}, makeSnapshot(copy))
    return newId
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
    db(supabase.from('card_types').delete().eq('id', id))
  }

  function selectCardType(id) {
    if (!selectedProject.value || !id) return
    selectedProject.value.selectedCardTypeId = id
    db(
      supabase
        .from('projects')
        .update({ selected_card_type_id: id })
        .eq('id', selectedProject.value.id)
    )
  }

  // ── CSV (au niveau card type) ────────────────────────
  function setCsvData(data, columns) {
    if (!selectedCardType.value) return
    selectedCardType.value.csvData = data
    selectedCardType.value.csvColumns = columns
    db(
      supabase
        .from('card_types')
        .update({ csv_data: data, csv_columns: columns })
        .eq('id', selectedCardType.value.id)
    )
  }

  function clearCsvData() {
    if (!selectedCardType.value) return
    selectedCardType.value.csvData = []
    selectedCardType.value.csvColumns = []
    db(
      supabase
        .from('card_types')
        .update({ csv_data: [], csv_columns: [] })
        .eq('id', selectedCardType.value.id)
    )
  }

  // ── Édition CSV ─────────────────────────────────────
  function syncCsvCell(rowIndex) {
    const ct = selectedCardType.value
    if (!ct) return

    // Mettre à jour les cartes générées qui référencent cette ligne
    selectedProject.value.generatedCards.forEach((gc) => {
      if (gc.cardTypeId !== ct.id) return
      const idx = parseInt(gc.id.split('-').pop())
      if (idx === rowIndex) {
        gc.data = { ...ct.csvData[rowIndex] }
        db(supabase.from('generated_cards').update({ data: gc.data }).eq('id', gc.id))
      }
    })

    db(
      supabase
        .from('card_types')
        .update({ csv_data: ct.csvData })
        .eq('id', ct.id)
    )
  }

  function addCsvRow() {
    const ct = selectedCardType.value
    if (!ct) return
    const newRow = {}
    ct.csvColumns.forEach((col) => {
      newRow[col] = ''
    })
    ct.csvData.push(newRow)
    db(
      supabase
        .from('card_types')
        .update({ csv_data: ct.csvData })
        .eq('id', ct.id)
    )
  }

  function deleteCsvRow(rowIndex) {
    const ct = selectedCardType.value
    if (!ct) return
    ct.csvData.splice(rowIndex, 1)
    db(
      supabase
        .from('card_types')
        .update({ csv_data: ct.csvData })
        .eq('id', ct.id)
    )
  }

  function addCsvColumn(name) {
    const ct = selectedCardType.value
    if (!ct || !name || ct.csvColumns.includes(name)) return
    ct.csvColumns.push(name)
    ct.csvData.forEach((row) => {
      row[name] = ''
    })
    db(
      supabase
        .from('card_types')
        .update({ csv_data: ct.csvData, csv_columns: ct.csvColumns })
        .eq('id', ct.id)
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

    selectedProject.value.generatedCards = [
      ...selectedProject.value.generatedCards.filter((c) => c.cardTypeId !== type.id),
      ...cards,
    ]

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

  function syncGeneratedCard(card) {
    db(supabase.from('generated_cards').update({ data: card.data }).eq('id', card.id))
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
    updateProjectRules,
    materials,
    addMaterial,
    updateMaterial,
    deleteMaterial,
    uploadMaterialFile,
    deleteMaterialFile,
    addCardType,
    updateCardType,
    duplicateCardType,
    deleteCardType,
    selectCardType,
    setCsvData,
    clearCsvData,
    generateCards,
    syncGeneratedCard,
    clearGeneratedCards,
    resetAll,
    cardTypeHistory,
    loadHistory,
    syncCsvCell,
    addCsvRow,
    deleteCsvRow,
    addCsvColumn,
  }
})
