<template>
    <!-- Chargement auth -->
    <div v-if="authLoading" class="min-h-screen flex items-center justify-center">
      <UIcon name="i-lucide-loader-2" class="text-4xl animate-spin text-[var(--ui-text-dimmed)]" />
    </div>

    <!-- Non connecté -->
    <AuthGate v-else-if="!authUser" />

    <!-- Connecté -->
    <UDashboardGroup v-else>
      <UDashboardSidebar>
        <template #header>
          <div class="flex items-center gap-2 px-1">
            <UIcon name="i-lucide-sparkles" class="text-xl text-[var(--ui-primary)] shrink-0" />
            <span class="font-bold text-base truncate">Gachapow</span>
          </div>
        </template>

        <template #default>
          <div class="flex flex-col gap-1 py-1">
            <!-- Un bloc par projet -->
            <div v-for="project in store.projects" :key="project.id">
              <!-- Nom du projet -->
              <button
                class="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-[var(--ui-radius)] text-left transition-colors group"
                :class="store.selectedProjectId === project.id
                  ? 'bg-[var(--ui-primary)] text-white'
                  : 'hover:bg-[var(--ui-bg-elevated)] text-[var(--ui-text)]'"
                @click="selectProject(project.id)"
              >
                <div class="flex items-center gap-2 min-w-0">
                  <UIcon name="i-lucide-folder" class="shrink-0 text-sm" />
                  <span class="font-semibold text-sm truncate">{{ project.name }}</span>
                </div>
                <UButton
                  size="xs"
                  variant="ghost"
                  :color="store.selectedProjectId === project.id ? 'white' : 'neutral'"
                  icon="i-lucide-trash-2"
                  class="opacity-0 group-hover:opacity-100 shrink-0"
                  @click.stop="deleteProject(project.id)"
                />
              </button>

              <!-- Sous-pages du projet sélectionné -->
              <div v-if="store.selectedProjectId === project.id" class="ml-3 mt-0.5 flex flex-col gap-0.5">

                <!-- Règles -->
                <button
                  class="flex items-center gap-2 px-2 py-1.5 rounded-[var(--ui-radius)] text-left text-sm transition-colors w-full"
                  :class="currentView === 'rules'
                    ? 'bg-[var(--ui-primary)]/10 text-[var(--ui-primary)] font-medium'
                    : 'text-[var(--ui-text-muted)] hover:bg-[var(--ui-bg-elevated)] hover:text-[var(--ui-text)]'"
                  @click="goToRules"
                >
                  <UIcon name="i-lucide-book-open" class="shrink-0 text-xs" />
                  <span>Règles</span>
                </button>

                <!-- Matériel -->
                <button
                  class="flex items-center gap-2 px-2 py-1.5 rounded-[var(--ui-radius)] text-left text-sm transition-colors w-full"
                  :class="currentView === 'materials'
                    ? 'bg-[var(--ui-primary)]/10 text-[var(--ui-primary)] font-medium'
                    : 'text-[var(--ui-text-muted)] hover:bg-[var(--ui-bg-elevated)] hover:text-[var(--ui-text)]'"
                  @click="goToMaterials"
                >
                  <UIcon name="i-lucide-package" class="shrink-0 text-xs" />
                  <span>Matériel</span>
                </button>

                <!-- Questionnaires -->
                <button
                  class="flex items-center gap-2 px-2 py-1.5 rounded-[var(--ui-radius)] text-left text-sm transition-colors w-full"
                  :class="currentView === 'questionnaires'
                    ? 'bg-[var(--ui-primary)]/10 text-[var(--ui-primary)] font-medium'
                    : 'text-[var(--ui-text-muted)] hover:bg-[var(--ui-bg-elevated)] hover:text-[var(--ui-text)]'"
                  @click="goToQuestionnaires"
                >
                  <UIcon name="i-lucide-clipboard-list" class="shrink-0 text-xs" />
                  <span>Questionnaires</span>
                  <span v-if="surveyStore.questionnaires.length" class="ml-auto text-xs text-[var(--ui-text-dimmed)]">
                    {{ surveyStore.questionnaires.length }}
                  </span>
                </button>

                <!-- Section Cartes (collapsible) -->
                <div>
                  <button
                    class="flex items-center gap-2 px-2 py-1.5 rounded-[var(--ui-radius)] text-left text-sm transition-colors w-full text-[var(--ui-text-muted)] hover:bg-[var(--ui-bg-elevated)] hover:text-[var(--ui-text)]"
                    @click="cardsExpanded = !cardsExpanded"
                  >
                    <UIcon
                      name="i-lucide-chevron-right"
                      class="shrink-0 text-xs transition-transform duration-150"
                      :class="cardsExpanded ? 'rotate-90' : ''"
                    />
                    <UIcon name="i-lucide-layers" class="shrink-0 text-xs" />
                    <span class="font-medium">Cartes</span>
                    <span v-if="store.cardTypes.length" class="ml-auto text-xs text-[var(--ui-text-dimmed)]">{{ store.cardTypes.length }}</span>
                  </button>

                  <!-- Types de cartes -->
                  <div v-if="cardsExpanded" class="ml-3 mt-0.5 flex flex-col gap-0.5">
                    <button
                      v-for="ct in store.cardTypes"
                      :key="ct.id"
                      class="flex items-center justify-between gap-2 px-2 py-1.5 rounded-[var(--ui-radius)] text-left text-sm transition-colors group/ct w-full"
                      :class="store.selectedCardTypeId === ct.id && currentView === 'cardtype'
                        ? 'bg-[var(--ui-primary)]/10 text-[var(--ui-primary)] font-medium'
                        : 'text-[var(--ui-text-muted)] hover:bg-[var(--ui-bg-elevated)] hover:text-[var(--ui-text)]'"
                      @click="goToCardType(ct.id)"
                    >
                      <div class="flex items-center gap-2 min-w-0">
                        <UIcon name="i-lucide-layout-template" class="shrink-0 text-xs" />
                        <span class="truncate">{{ ct.name }}</span>
                      </div>
                      <div class="flex gap-0.5 opacity-0 group-hover/ct:opacity-100 shrink-0">
                        <UButton size="xs" variant="ghost" color="neutral" icon="i-lucide-copy" title="Dupliquer" @click.stop="duplicateCardType(ct.id)" />
                        <UButton size="xs" variant="ghost" color="neutral" icon="i-lucide-history" @click.stop="openHistory(ct)" />
                        <UButton size="xs" variant="ghost" color="error" icon="i-lucide-trash-2" @click.stop="store.deleteCardType(ct.id)" />
                      </div>
                    </button>

                    <!-- Ajouter un type -->
                    <button
                      class="flex items-center gap-2 px-2 py-1.5 rounded-[var(--ui-radius)] text-left text-sm text-[var(--ui-text-dimmed)] hover:bg-[var(--ui-bg-elevated)] hover:text-[var(--ui-primary)] transition-colors w-full"
                      @click="createNewCardType"
                    >
                      <UIcon name="i-lucide-plus" class="shrink-0 text-xs" />
                      <span>Ajouter un type</span>
                    </button>
                  </div>
                </div>

              </div>
            </div>

            <!-- Ajouter un projet -->
            <button
              class="flex items-center gap-2 px-3 py-2 rounded-[var(--ui-radius)] text-sm text-[var(--ui-text-dimmed)] hover:bg-[var(--ui-bg-elevated)] hover:text-[var(--ui-primary)] transition-colors w-full mt-1"
              @click="currentView = 'newproject'"
            >
              <UIcon name="i-lucide-folder-plus" class="shrink-0 text-sm" />
              <span>Ajouter un projet</span>
            </button>
          </div>
        </template>

        <template #footer>
          <div class="flex items-center gap-2 px-1">
            <UColorModeButton size="sm" variant="ghost" color="neutral" />
            <UButton
              size="sm"
              variant="ghost"
              color="neutral"
              icon="i-lucide-settings"
              @click="currentView = 'settings'"
            />
            <UButton
              size="sm"
              variant="ghost"
              color="neutral"
              icon="i-lucide-log-out"
              @click="handleLogout"
            />
          </div>
        </template>
      </UDashboardSidebar>

      <UDashboardPanel grow>
        <template #header>
          <UDashboardNavbar :title="viewTitle" />
        </template>

        <template #body>
          <!-- Chargement données -->
          <div v-if="store.loading" class="flex items-center justify-center py-20">
            <div class="text-center text-[var(--ui-text-dimmed)]">
              <UIcon name="i-lucide-loader-2" class="text-4xl animate-spin mb-3" />
              <p>Chargement…</p>
            </div>
          </div>

          <template v-else>
            <!-- Vue : Nouveau projet -->
            <div v-if="currentView === 'newproject'" class="max-w-sm mx-auto pt-10">
              <div class="text-center mb-6">
                <UIcon name="i-lucide-folder-plus" class="text-4xl text-[var(--ui-text-dimmed)] mb-3" />
                <h2 class="text-lg font-semibold mb-1">Créer un projet</h2>
                <p class="text-sm text-[var(--ui-text-muted)]">Un projet regroupe vos types de cartes et vos données.</p>
              </div>
              <div class="flex gap-2">
                <UInput v-model="newProjectName" placeholder="Nom du projet" class="flex-1" @keyup.enter="createProject" />
                <UButton icon="i-lucide-plus" :disabled="!newProjectName.trim()" @click="createProject">Créer</UButton>
              </div>
            </div>

            <!-- Vue : Nouveau type de carte -->
            <div v-else-if="currentView === 'newtype'" class="space-y-6">
              <CardTypeEditor @saved="onCardTypeSaved" @cancel="cancelNewCardType" />
            </div>

            <!-- Vue : Type de carte avec onglets -->
            <div v-else-if="currentView === 'cardtype' && store.selectedCardType">
              <!-- Barre d'onglets -->
              <div class="border-b border-[var(--ui-border)] mb-6 -mx-4 px-4">
                <div class="flex flex-wrap gap-0">
                  <button
                    v-for="tab in tabs"
                    :key="tab.key"
                    class="flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 text-sm font-medium border-b-2 transition-colors"
                    :class="currentTab === tab.key
                      ? 'border-[var(--ui-primary)] text-[var(--ui-primary)]'
                      : 'border-transparent text-[var(--ui-text-muted)] hover:text-[var(--ui-text)] hover:border-[var(--ui-border-accented)]'"
                    @click="currentTab = tab.key"
                  >
                    <UIcon :name="tab.icon" class="text-sm" />
                    <span>{{ tab.label }}</span>
                    <UBadge
                      v-if="tab.badge"
                      :label="String(tab.badge)"
                      color="primary"
                      variant="subtle"
                      size="xs"
                    />
                  </button>
                </div>
              </div>

              <!-- Contenu de l'onglet -->
              <div class="space-y-6">
                <!-- Onglet Options -->
                <CardTypeEditor v-if="currentTab === 'options'" :tab-mode="true" @saved="() => {}" />

                <!-- Onglet Données -->
                <template v-else-if="currentTab === 'data'">
                  <CsvUploader />
                  <DataWorkbench v-if="store.csvData.length > 0" />
                </template>

                <!-- Onglet Galerie -->
                <CardGallery v-else-if="currentTab === 'gallery'" />
              </div>
            </div>

            <!-- Vue : Règles du projet -->
            <div v-else-if="currentView === 'rules'">
              <ProjectRules />
            </div>

            <!-- Vue : Matériel du projet -->
            <div v-else-if="currentView === 'materials'">
              <ProjectMaterials />
            </div>

            <!-- Vue : Questionnaires du projet -->
            <div v-else-if="currentView === 'questionnaires'">
              <QuestionnaireBuilder />
            </div>

            <!-- Vue : Paramètres -->
            <div v-else-if="currentView === 'settings'">
              <div class="rounded-[var(--ui-radius)] border border-[var(--ui-border)] bg-[var(--ui-bg)] shadow-sm max-w-lg">
                <div class="px-4 py-3 border-b border-[var(--ui-border)]">
                  <p class="font-semibold text-sm">Zone de danger</p>
                </div>
                <div class="p-4">
                  <p class="text-sm text-[var(--ui-text-dimmed)] mb-4">
                    Réinitialiser supprimera tous les projets, types de cartes, données CSV et cartes générées.
                  </p>
                  <UButton color="error" variant="soft" icon="i-lucide-rotate-ccw" @click="confirmReset">
                    Tout réinitialiser
                  </UButton>
                </div>
              </div>
            </div>

            <!-- État vide : aucun type sélectionné -->
            <div v-else class="flex flex-col items-center justify-center py-20 text-[var(--ui-text-dimmed)]">
              <UIcon name="i-lucide-layout-template" class="text-5xl mb-4" />
              <p class="text-base mb-1">Aucun type de carte sélectionné</p>
              <p class="text-sm mb-6">Sélectionne un type dans le menu ou crée-en un nouveau.</p>
              <UButton icon="i-lucide-plus" @click="createNewCardType">Créer un type de carte</UButton>
            </div>
          </template>
        </template>
      </UDashboardPanel>

      <!-- Modal historique -->
      <CardTypeHistory
        :open="historyOpen"
        :card-type-id="historyCardType?.id"
        :card-type-name="historyCardType?.name"
        @close="historyOpen = false"
      />
    </UDashboardGroup>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useAuth } from './composables/useAuth.js'
import { useCardsStore } from './stores/cards.js'
import { useSurveyStore } from './stores/survey.js'
import AuthGate from './components/AuthGate.vue'
import CardTypeEditor from './components/CardTypeEditor.vue'
import CsvUploader from './components/CsvUploader.vue'
import DataWorkbench from './components/DataWorkbench.vue'
import CardGallery from './components/CardGallery.vue'
import CardTypeHistory from './components/CardTypeHistory.vue'
import ProjectRules from './components/ProjectRules.vue'
import ProjectMaterials from './components/ProjectMaterials.vue'
import QuestionnaireBuilder from './components/QuestionnaireBuilder.vue'

const { user: authUser, loading: authLoading, init: initAuth, signOut } = useAuth()
const store = useCardsStore()
const surveyStore = useSurveyStore()

const historyOpen = ref(false)
const historyCardType = ref(null)
const currentView = ref('newproject')
const currentTab = ref('options')
const newProjectName = ref('')
const cardsExpanded = ref(true)

onMounted(() => {
  initAuth()
})

watch(authUser, (user) => {
  if (user) store.init()
})

// Charger les questionnaires quand le projet change
watch(() => store.selectedProjectId, (id) => {
  if (id) surveyStore.loadForProject(id)
})

// Quand les projets sont chargés depuis la DB, naviguer vers le bon état
watch(() => store.projects.length, (len) => {
  if (len > 0 && currentView.value === 'newproject') {
    if (store.selectedCardType) {
      currentView.value = 'cardtype'
    }
  }
})

const cardsForType = computed(() =>
  store.generatedCards.filter((c) => c.cardTypeId === store.selectedCardTypeId)
)

const tabs = computed(() => [
  { key: 'options', label: 'Options', icon: 'i-lucide-settings-2' },
  {
    key: 'data',
    label: 'Données',
    icon: 'i-lucide-table',
    badge: store.csvData.length > 0 ? store.csvData.length : null,
  },
  {
    key: 'gallery',
    label: 'Galerie',
    icon: 'i-lucide-images',
    badge: cardsForType.value.length > 0 ? cardsForType.value.length : null,
  },
])

const viewTitle = computed(() => {
  if (currentView.value === 'newproject') return 'Projets'
  if (currentView.value === 'newtype') return 'Nouveau type de carte'
  if (currentView.value === 'settings') return 'Paramètres'
  if (currentView.value === 'rules') return `Règles — ${store.selectedProject?.name ?? ''}`
  if (currentView.value === 'materials') return `Matériel — ${store.selectedProject?.name ?? ''}`
  if (currentView.value === 'questionnaires') return `Questionnaires — ${store.selectedProject?.name ?? ''}`
  if (currentView.value === 'cardtype') {
    const tabLabel = tabs.value.find((t) => t.key === currentTab.value)?.label ?? ''
    return store.selectedCardType
      ? `${store.selectedCardType.name} — ${tabLabel}`
      : 'Type de carte'
  }
  return ''
})

function selectProject(id) {
  store.selectProject(id)
  // Si un type est déjà sélectionné dans ce projet, aller dessus
  if (store.selectedCardType) {
    currentView.value = 'cardtype'
    currentTab.value = 'options'
  }
}

function deleteProject(id) {
  if (!window.confirm('Supprimer ce projet et toutes ses données ?')) return
  store.deleteProject(id)
  currentView.value = store.projects.length > 0 ? (store.selectedCardType ? 'cardtype' : 'newproject') : 'newproject'
}

function createProject() {
  const name = newProjectName.value.trim()
  if (!name) return
  store.addProject(name)
  newProjectName.value = ''
  // Nouveau projet vide → inviter à créer un type
  currentView.value = 'newtype'
}

function goToCardType(id) {
  store.selectCardType(id)
  currentView.value = 'cardtype'
  currentTab.value = 'options'
}

function duplicateCardType(id) {
  const newId = store.duplicateCardType(id)
  if (newId) {
    store.selectCardType(newId)
    currentView.value = 'cardtype'
    currentTab.value = 'options'
  }
}

function createNewCardType() {
  currentView.value = 'newtype'
}

function goToRules() {
  currentView.value = 'rules'
}

function goToMaterials() {
  currentView.value = 'materials'
}

function goToQuestionnaires() {
  currentView.value = 'questionnaires'
}

function onCardTypeSaved() {
  // Après création/sauvegarde → aller sur l'onglet Options du type
  currentView.value = 'cardtype'
  currentTab.value = 'options'
}

function cancelNewCardType() {
  currentView.value = store.selectedCardType ? 'cardtype' : 'newproject'
}

function openHistory(ct) {
  historyCardType.value = ct
  historyOpen.value = true
}

function handleLogout() {
  signOut()
  currentView.value = 'newproject'
}

function confirmReset() {
  if (window.confirm('Supprimer tous les projets, types de cartes, données CSV et cartes générées ?')) {
    store.resetAll()
    currentView.value = 'newproject'
  }
}
</script>
