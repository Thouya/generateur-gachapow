<template>
  <!-- ─── Chargement ─── -->
  <div v-if="state === 'loading'" class="min-h-screen flex items-center justify-center bg-[var(--ui-bg)]">
    <UIcon name="i-lucide-loader-2" class="text-4xl animate-spin text-[var(--ui-text-dimmed)]" />
  </div>

  <!-- ─── Introuvable / Erreur ─── -->
  <div
    v-else-if="state === 'not_found'"
    class="min-h-screen flex items-center justify-center bg-[var(--ui-bg)] px-4"
  >
    <div class="text-center max-w-sm">
      <UIcon name="i-lucide-file-question" class="text-5xl text-[var(--ui-text-dimmed)] mb-4" />
      <h1 class="text-2xl font-bold mb-2">Questionnaire introuvable</h1>
      <p class="text-[var(--ui-text-muted)]">Ce lien est invalide ou le questionnaire n'est plus disponible.</p>
    </div>
  </div>

  <!-- ─── Formulaire ─── -->
  <div
    v-else-if="state === 'form' && questionnaire"
    class="min-h-screen bg-[var(--ui-bg)] py-10 px-4"
  >
    <div class="max-w-2xl mx-auto space-y-8">
      <!-- En-tête -->
      <div class="text-center">
        <UIcon name="i-lucide-sparkles" class="text-3xl text-[var(--ui-primary)] mb-3" />
        <h1 class="text-3xl font-bold mb-2">{{ questionnaire.title }}</h1>
        <p v-if="questionnaire.description" class="text-[var(--ui-text-muted)] text-base leading-relaxed">
          {{ questionnaire.description }}
        </p>
      </div>

      <!-- Questions -->
      <div class="space-y-6">
        <div
          v-for="(q, idx) in questionnaire.questions"
          :key="q.id"
          class="rounded-[var(--ui-radius)] border border-[var(--ui-border)] bg-[var(--ui-bg)] p-5 shadow-sm"
        >
          <!-- Label -->
          <div class="flex items-start gap-2 mb-4">
            <span class="text-sm text-[var(--ui-text-muted)] shrink-0 mt-0.5">{{ idx + 1 }}.</span>
            <p class="text-base font-medium text-[var(--ui-text)] leading-snug">
              {{ q.label }}
              <span v-if="q.required" class="text-red-500 ml-1">*</span>
            </p>
          </div>

          <!-- Validation error -->
          <p v-if="errors[q.id]" class="text-xs text-red-500 mb-2 -mt-2">{{ errors[q.id] }}</p>

          <!-- ── Texte court ── -->
          <input
            v-if="q.type === 'text_short'"
            v-model="answers[q.id]"
            type="text"
            class="w-full text-sm border border-[var(--ui-border)] rounded-[var(--ui-radius)] px-3 py-2 bg-[var(--ui-bg-elevated)] text-[var(--ui-text)] placeholder-[var(--ui-text-dimmed)] focus:outline-none focus:ring-2 focus:ring-[var(--ui-primary)]"
            placeholder="Votre réponse…"
          />

          <!-- ── Texte long ── -->
          <textarea
            v-else-if="q.type === 'text_long'"
            v-model="answers[q.id]"
            rows="4"
            class="w-full text-sm border border-[var(--ui-border)] rounded-[var(--ui-radius)] px-3 py-2 bg-[var(--ui-bg-elevated)] text-[var(--ui-text)] placeholder-[var(--ui-text-dimmed)] focus:outline-none focus:ring-2 focus:ring-[var(--ui-primary)] resize-none"
            placeholder="Votre réponse…"
          />

          <!-- ── Oui / Non ── -->
          <div v-else-if="q.type === 'yes_no'" class="flex gap-3">
            <button
              class="flex-1 py-2.5 rounded-[var(--ui-radius)] border text-sm font-medium transition-colors"
              :class="answers[q.id] === 'yes'
                ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                : 'border-[var(--ui-border)] text-[var(--ui-text-muted)] hover:bg-[var(--ui-bg-elevated)]'"
              @click="answers[q.id] = 'yes'"
            >
              ✅ Oui
            </button>
            <button
              class="flex-1 py-2.5 rounded-[var(--ui-radius)] border text-sm font-medium transition-colors"
              :class="answers[q.id] === 'no'
                ? 'border-red-500 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                : 'border-[var(--ui-border)] text-[var(--ui-text-muted)] hover:bg-[var(--ui-bg-elevated)]'"
              @click="answers[q.id] = 'no'"
            >
              ❌ Non
            </button>
          </div>

          <!-- ── Note (étoiles 1-5 ou 1-10) ── -->
          <div v-else-if="q.type === 'rating'" class="flex flex-wrap gap-2">
            <button
              v-for="n in (q.scale ?? 5)"
              :key="n"
              class="w-10 h-10 rounded-[var(--ui-radius)] border text-sm font-semibold transition-colors"
              :class="answers[q.id] === n
                ? 'border-[var(--ui-primary)] bg-[var(--ui-primary)] text-white'
                : 'border-[var(--ui-border)] text-[var(--ui-text-muted)] hover:border-[var(--ui-primary)] hover:text-[var(--ui-primary)]'"
              @click="answers[q.id] = n"
            >
              {{ (q.scale ?? 5) <= 5 ? ['①','②','③','④','⑤'][n-1] : n }}
            </button>
            <span v-if="(q.scale ?? 5) <= 5 && answers[q.id]" class="text-2xl ml-2 leading-10">
              {{ '⭐'.repeat(answers[q.id]) }}
            </span>
          </div>

          <!-- ── NPS (0-10) ── -->
          <div v-else-if="q.type === 'nps'">
            <div class="flex gap-1 flex-wrap">
              <button
                v-for="n in 11"
                :key="n - 1"
                class="w-9 h-9 rounded-[var(--ui-radius)] border text-sm font-medium transition-colors"
                :class="answers[q.id] === (n - 1)
                  ? 'border-[var(--ui-primary)] bg-[var(--ui-primary)] text-white'
                  : 'border-[var(--ui-border)] text-[var(--ui-text-muted)] hover:border-[var(--ui-primary)]'"
                @click="answers[q.id] = n - 1"
              >
                {{ n - 1 }}
              </button>
            </div>
            <div class="flex justify-between mt-1.5 text-xs text-[var(--ui-text-dimmed)]">
              <span>Pas du tout</span>
              <span>Absolument</span>
            </div>
          </div>

          <!-- ── Choix unique ── -->
          <div v-else-if="q.type === 'single_choice'" class="space-y-2">
            <label
              v-for="opt in (q.options ?? [])"
              :key="opt"
              class="flex items-center gap-3 p-3 rounded-[var(--ui-radius)] border cursor-pointer transition-colors"
              :class="answers[q.id] === opt
                ? 'border-[var(--ui-primary)] bg-[var(--ui-primary)]/5'
                : 'border-[var(--ui-border)] hover:bg-[var(--ui-bg-elevated)]'"
            >
              <input
                type="radio"
                :name="`q_${q.id}`"
                :value="opt"
                v-model="answers[q.id]"
                class="accent-[var(--ui-primary)]"
              />
              <span class="text-sm">{{ opt }}</span>
            </label>
          </div>

          <!-- ── Choix multiple ── -->
          <div v-else-if="q.type === 'multiple_choice'" class="space-y-2">
            <label
              v-for="opt in (q.options ?? [])"
              :key="opt"
              class="flex items-center gap-3 p-3 rounded-[var(--ui-radius)] border cursor-pointer transition-colors"
              :class="(answers[q.id] ?? []).includes(opt)
                ? 'border-[var(--ui-primary)] bg-[var(--ui-primary)]/5'
                : 'border-[var(--ui-border)] hover:bg-[var(--ui-bg-elevated)]'"
            >
              <input
                type="checkbox"
                :value="opt"
                :checked="(answers[q.id] ?? []).includes(opt)"
                class="rounded accent-[var(--ui-primary)]"
                @change="toggleMultiChoice(q.id, opt)"
              />
              <span class="text-sm">{{ opt }}</span>
            </label>
          </div>

          <!-- ── Cartes du projet ── -->
          <div v-else-if="q.type === 'project_cards'">
            <p v-if="!cardTypeMap[q.cardTypeId]" class="text-sm text-[var(--ui-text-dimmed)] italic">
              Aucune carte disponible pour ce questionnaire.
            </p>
            <div v-else>
              <p class="text-xs text-[var(--ui-text-muted)] mb-3">
                {{ q.multiple ? 'Sélectionnez une ou plusieurs cartes' : 'Sélectionnez une carte' }}
              </p>
              <div class="flex flex-wrap gap-4">
                <div
                  v-for="card in cardsForType(q.cardTypeId)"
                  :key="card.id"
                  class="flex flex-col gap-2"
                  :style="{ width: Math.round((cardTypeMap[q.cardTypeId].width || 300) * cardScale) + 'px' }"
                >
                  <!-- Carte à l'échelle réduite -->
                  <div
                    class="cursor-pointer transition-all"
                    :class="isCardSelected(q, card.id) ? 'ring-2 ring-[var(--ui-primary)] ring-offset-2 rounded-[12px]' : 'opacity-80 hover:opacity-100'"
                    @click="toggleCard(q, card.id)"
                  >
                    <div
                      :style="{
                        width: Math.round((cardTypeMap[q.cardTypeId].width || 300) * cardScale) + 'px',
                        height: Math.round((cardTypeMap[q.cardTypeId].height || 420) * cardScale) + 'px',
                        overflow: 'hidden',
                        position: 'relative',
                        borderRadius: '12px',
                      }"
                    >
                      <div
                        :style="{
                          transform: `scale(${cardScale})`,
                          transformOrigin: 'top left',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                        }"
                      >
                        <CardPreview :card-type="cardTypeMap[q.cardTypeId]" :card-data="card.data" />
                      </div>
                    </div>
                  </div>
                  <!-- Feedback par carte (si activé et carte sélectionnée) -->
                  <textarea
                    v-if="q.withFeedback && isCardSelected(q, card.id)"
                    v-model="answers[q.id + '_feedback'][card.id]"
                    rows="2"
                    class="w-full text-xs border border-[var(--ui-primary)]/40 rounded-[var(--ui-radius)] px-2 py-1.5 bg-[var(--ui-bg-elevated)] text-[var(--ui-text)] placeholder-[var(--ui-text-dimmed)] focus:outline-none focus:ring-1 focus:ring-[var(--ui-primary)] resize-none"
                    placeholder="Votre retour sur cette carte…"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- ── Matériel du projet ── -->
          <div v-else-if="q.type === 'project_materials'" class="space-y-2">
            <p v-if="!q.materialsSnapshot?.length" class="text-sm text-[var(--ui-text-dimmed)] italic">
              Aucun matériel disponible.
            </p>
            <div
              v-for="mat in (q.materialsSnapshot ?? [])"
              :key="mat.id"
              class="space-y-1.5"
            >
              <label
                class="flex items-center gap-3 p-3 rounded-[var(--ui-radius)] border cursor-pointer transition-colors"
                :class="isMaterialSelected(q, mat.name)
                  ? 'border-[var(--ui-primary)] bg-[var(--ui-primary)]/5'
                  : 'border-[var(--ui-border)] hover:bg-[var(--ui-bg-elevated)]'"
              >
                <input
                  v-if="q.multiple"
                  type="checkbox"
                  :checked="isMaterialSelected(q, mat.name)"
                  class="rounded accent-[var(--ui-primary)]"
                  @change="toggleMaterial(q.id, mat.name)"
                />
                <input
                  v-else
                  type="radio"
                  :name="`qmat_${q.id}`"
                  :value="mat.name"
                  v-model="answers[q.id]"
                  class="accent-[var(--ui-primary)]"
                />
                <div class="flex-1 min-w-0">
                  <span class="text-sm font-medium">{{ mat.name }}</span>
                  <span class="text-xs text-[var(--ui-text-dimmed)] ml-2">×{{ mat.quantity }}</span>
                </div>
              </label>
              <!-- Feedback par élément matériel (si activé et élément sélectionné) -->
              <textarea
                v-if="q.withFeedback && isMaterialSelected(q, mat.name)"
                v-model="answers[q.id + '_feedback'][mat.name]"
                rows="2"
                class="w-full text-xs border border-[var(--ui-primary)]/40 rounded-[var(--ui-radius)] px-3 py-1.5 bg-[var(--ui-bg-elevated)] text-[var(--ui-text)] placeholder-[var(--ui-text-dimmed)] focus:outline-none focus:ring-1 focus:ring-[var(--ui-primary)] resize-none"
                :placeholder="`Votre retour sur « ${mat.name} »…`"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Erreur globale de validation -->
      <div
        v-if="submitError"
        class="p-3 rounded-[var(--ui-radius)] bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400"
      >
        {{ submitError }}
      </div>

      <!-- Bouton Soumettre -->
      <div class="flex justify-center">
        <UButton
          size="lg"
          icon="i-lucide-send"
          :loading="submitting"
          @click="submit"
        >
          Envoyer mes réponses
        </UButton>
      </div>

      <!-- Footer -->
      <p class="text-center text-xs text-[var(--ui-text-dimmed)]">
        Créé avec Gachapow ✨
      </p>
    </div>
  </div>

  <!-- ─── Merci ─── -->
  <div
    v-else-if="state === 'submitted'"
    class="min-h-screen flex items-center justify-center bg-[var(--ui-bg)] px-4"
  >
    <div class="text-center max-w-sm">
      <div class="text-6xl mb-6">🎉</div>
      <h1 class="text-3xl font-bold mb-3">Merci !</h1>
      <p class="text-[var(--ui-text-muted)] text-base">
        Vos réponses ont bien été enregistrées.
      </p>
      <p class="text-sm text-[var(--ui-text-dimmed)] mt-2">
        Merci pour votre retour sur <strong>{{ questionnaire?.title }}</strong>.
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { supabase } from '../utils/supabase.js'
import { useSurveyStore } from '../stores/survey.js'
import CardPreview from '../components/CardPreview.vue'

const route = useRoute()
const surveyStore = useSurveyStore()

// ── State ────────────────────────────────────────────
const state        = ref('loading') // 'loading' | 'not_found' | 'form' | 'submitted'
const questionnaire = ref(null)
const answers      = reactive({})
const errors       = reactive({})
const submitError  = ref('')
const submitting   = ref(false)

// Données cartes
const cardTypeMap  = ref({}) // cardTypeId → cardType object
const cardsData    = ref({}) // cardTypeId → [ { id, data } ]
const cardScale    = 0.42

// ── Init ─────────────────────────────────────────────
onMounted(async () => {
  const token = route.params.token
  const { data, error } = await surveyStore.getPublicQuestionnaire(token)

  if (error || !data) {
    state.value = 'not_found'
    return
  }

  questionnaire.value = data

  // Initialiser les answers
  data.questions.forEach((q) => {
    if (q.type === 'multiple_choice' || (q.type === 'project_materials' && q.multiple)) {
      answers[q.id] = []
    } else if (q.type === 'project_cards' && q.multiple) {
      answers[q.id] = []
    } else {
      answers[q.id] = undefined
    }
    // Feedback textuel par élément (cartes ou matériel)
    if ((q.type === 'project_cards' || q.type === 'project_materials') && q.withFeedback) {
      answers[q.id + '_feedback'] = {}
    }
  })

  // Charger les données cartes (pour les questions project_cards)
  await loadCardData(data)

  state.value = 'form'
})

async function loadCardData(q) {
  const cardTypeIds = [
    ...new Set(
      q.questions
        .filter((q) => q.type === 'project_cards' && q.cardTypeId)
        .map((q) => q.cardTypeId)
    ),
  ]
  if (!cardTypeIds.length) return

  // Charger les card_types
  const { data: ctRows } = await supabase
    .from('card_types')
    .select('*')
    .in('id', cardTypeIds)

  if (ctRows) {
    ctRows.forEach((row) => {
      cardTypeMap.value[row.id] = {
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
    })
  }

  // Charger les generated_cards
  const { data: gcRows } = await supabase
    .from('generated_cards')
    .select('*')
    .in('card_type_id', cardTypeIds)

  if (gcRows) {
    gcRows.forEach((row) => {
      if (!cardsData.value[row.card_type_id]) {
        cardsData.value[row.card_type_id] = []
      }
      cardsData.value[row.card_type_id].push({
        id: row.id,
        data: row.data || {},
      })
    })
  }
}

function cardsForType(cardTypeId) {
  return cardsData.value[cardTypeId] ?? []
}

// ── Interactions ─────────────────────────────────────
function toggleMultiChoice(qId, opt) {
  const current = answers[qId] ?? []
  if (current.includes(opt)) {
    answers[qId] = current.filter((v) => v !== opt)
  } else {
    answers[qId] = [...current, opt]
  }
}

function isCardSelected(q, cardId) {
  if (q.multiple) {
    return (answers[q.id] ?? []).includes(cardId)
  }
  return answers[q.id] === cardId
}

function toggleCard(q, cardId) {
  if (q.multiple) {
    const current = answers[q.id] ?? []
    answers[q.id] = current.includes(cardId)
      ? current.filter((id) => id !== cardId)
      : [...current, cardId]
  } else {
    answers[q.id] = answers[q.id] === cardId ? undefined : cardId
  }
}

function isMaterialSelected(q, name) {
  if (q.multiple) {
    return (answers[q.id] ?? []).includes(name)
  }
  return answers[q.id] === name
}

function toggleMaterial(qId, name) {
  const current = answers[qId] ?? []
  answers[qId] = current.includes(name)
    ? current.filter((n) => n !== name)
    : [...current, name]
}

// ── Validation et soumission ─────────────────────────
function validate() {
  let valid = true
  Object.keys(errors).forEach((k) => delete errors[k])

  for (const q of questionnaire.value.questions) {
    if (!q.required) continue
    const a = answers[q.id]
    const isEmpty = a === undefined || a === null || a === '' || (Array.isArray(a) && !a.length)
    if (isEmpty) {
      errors[q.id] = 'Cette question est obligatoire.'
      valid = false
    }
  }
  return valid
}

async function submit() {
  submitError.value = ''
  if (!validate()) {
    submitError.value = 'Veuillez répondre à toutes les questions obligatoires.'
    return
  }

  submitting.value = true
  const { error } = await surveyStore.submitResponse(questionnaire.value.id, { ...answers })
  submitting.value = false

  if (error) {
    submitError.value = 'Une erreur est survenue. Veuillez réessayer.'
    console.error('[Survey submit]', error)
  } else {
    state.value = 'submitted'
  }
}
</script>
