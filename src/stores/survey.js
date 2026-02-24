import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '../utils/supabase.js'

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

function db(promise) {
  promise.then((result) => {
    if (result?.error) console.error('[Supabase Survey]', result.error.message)
  })
}

function dbToQuestionnaire(row) {
  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    description: row.description || '',
    questions: row.questions || [],
    isPublished: row.is_published,
    token: row.token,
    createdAt: row.created_at,
  }
}

export const useSurveyStore = defineStore('survey', () => {
  const questionnaires = ref([])
  const currentProjectId = ref(null)
  const loading = ref(false)
  const responses = ref([])
  const loadingResponses = ref(false)

  // ── Load questionnaires for a project ──────────────
  async function loadForProject(projectId) {
    if (!projectId) return
    // Reset if project changed
    if (currentProjectId.value !== projectId) {
      questionnaires.value = []
      responses.value = []
    }
    currentProjectId.value = projectId
    loading.value = true

    const { data, error } = await supabase
      .from('questionnaires')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })

    if (!error && data) {
      questionnaires.value = data.map(dbToQuestionnaire)
    } else if (error) {
      console.error('[Supabase Survey]', error.message)
    }
    loading.value = false
  }

  // ── CRUD ────────────────────────────────────────────
  async function addQuestionnaire(projectId) {
    const id = uid()
    const token = uid() + uid() + uid() // longer token for security
    const q = {
      id,
      projectId,
      title: 'Nouveau questionnaire',
      description: '',
      questions: [],
      isPublished: false,
      token,
      createdAt: new Date().toISOString(),
    }
    questionnaires.value.push(q)

    const { error } = await supabase.from('questionnaires').insert({
      id,
      project_id: projectId,
      title: q.title,
      description: q.description,
      questions: q.questions,
      is_published: false,
      token,
    })
    if (error) console.error('[Supabase Survey]', error.message)
    return id
  }

  function updateQuestionnaire(id, updates) {
    const idx = questionnaires.value.findIndex((q) => q.id === id)
    if (idx === -1) return
    Object.assign(questionnaires.value[idx], updates)

    const dbUpdates = {}
    if ('title' in updates) dbUpdates.title = updates.title
    if ('description' in updates) dbUpdates.description = updates.description
    if ('questions' in updates) dbUpdates.questions = updates.questions
    if ('isPublished' in updates) dbUpdates.is_published = updates.isPublished

    db(supabase.from('questionnaires').update(dbUpdates).eq('id', id))
  }

  function deleteQuestionnaire(id) {
    questionnaires.value = questionnaires.value.filter((q) => q.id !== id)
    db(supabase.from('questionnaires').delete().eq('id', id))
  }

  // ── Responses ───────────────────────────────────────
  async function loadResponses(questionnaireId) {
    loadingResponses.value = true
    responses.value = []

    const { data, error } = await supabase
      .from('questionnaire_responses')
      .select('*')
      .eq('questionnaire_id', questionnaireId)
      .order('created_at', { ascending: false })

    if (!error && data) {
      responses.value = data.map((r) => ({
        id: r.id,
        questionnaireId: r.questionnaire_id,
        answers: r.answers || {},
        respondentToken: r.respondent_token,
        createdAt: r.created_at,
      }))
    }
    loadingResponses.value = false
  }

  // ── Public API (SurveyView, no auth) ────────────────
  async function getPublicQuestionnaire(token) {
    const { data, error } = await supabase
      .from('questionnaires')
      .select('*')
      .eq('token', token)
      .eq('is_published', true)
      .single()

    if (error || !data) return { error: error?.message || 'Questionnaire introuvable' }
    return { data: dbToQuestionnaire(data) }
  }

  async function submitResponse(questionnaireId, answers) {
    const id = uid()
    const respondentToken = uid()
    const { error } = await supabase.from('questionnaire_responses').insert({
      id,
      questionnaire_id: questionnaireId,
      answers,
      respondent_token: respondentToken,
    })
    return { error, respondentToken }
  }

  return {
    questionnaires,
    loading,
    responses,
    loadingResponses,
    currentProjectId,
    loadForProject,
    addQuestionnaire,
    updateQuestionnaire,
    deleteQuestionnaire,
    loadResponses,
    getPublicQuestionnaire,
    submitResponse,
  }
})
