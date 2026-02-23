<template>
  <UApp>
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

              <!-- Sous-menu si ce projet est sélectionné -->
              <div v-if="store.selectedProjectId === project.id" class="ml-4 mt-0.5 flex flex-col gap-0.5">
                <!-- Types de cartes (en-tête section) -->
                <button
                  class="flex items-center gap-2 px-3 py-1.5 rounded-[var(--ui-radius)] text-left text-sm transition-colors w-full"
                  :class="currentView === 'cardtypes'
                    ? 'bg-[var(--ui-bg-elevated)] text-[var(--ui-text)] font-medium'
                    : 'text-[var(--ui-text-muted)] hover:bg-[var(--ui-bg-elevated)] hover:text-[var(--ui-text)]'"
                  @click="currentView = 'cardtypes'; editingCardType = null"
                >
                  <UIcon name="i-lucide-layout-template" class="shrink-0 text-xs" />
                  <span>Types de cartes</span>
                </button>

                <!-- Liste des types de cartes -->
                <div class="ml-4 flex flex-col gap-0.5">
                  <button
                    v-for="ct in store.cardTypes"
                    :key="ct.id"
                    class="flex items-center justify-between gap-2 px-3 py-1.5 rounded-[var(--ui-radius)] text-left text-sm transition-colors group/ct w-full"
                    :class="store.selectedCardTypeId === ct.id && currentView === 'cardtypes'
                      ? 'bg-[var(--ui-primary)]/10 text-[var(--ui-primary)] font-medium'
                      : 'text-[var(--ui-text-muted)] hover:bg-[var(--ui-bg-elevated)] hover:text-[var(--ui-text)]'"
                    @click="selectCardType(ct.id)"
                  >
                    <span class="truncate">{{ ct.name }}</span>
                    <div class="flex gap-0.5 opacity-0 group-hover/ct:opacity-100 shrink-0">
                      <UButton size="xs" variant="ghost" color="neutral" icon="i-lucide-pencil" @click.stop="editType(ct)" />
                      <UButton size="xs" variant="ghost" color="neutral" icon="i-lucide-history" @click.stop="openHistory(ct)" />
                      <UButton size="xs" variant="ghost" color="error" icon="i-lucide-trash-2" @click.stop="store.deleteCardType(ct.id)" />
                    </div>
                  </button>

                  <!-- Ajouter un type de carte -->
                  <button
                    class="flex items-center gap-2 px-3 py-1.5 rounded-[var(--ui-radius)] text-left text-sm text-[var(--ui-text-dimmed)] hover:bg-[var(--ui-bg-elevated)] hover:text-[var(--ui-primary)] transition-colors w-full"
                    @click="addCardType"
                  >
                    <UIcon name="i-lucide-plus" class="shrink-0 text-xs" />
                    <span>Ajouter un type</span>
                  </button>
                </div>

                <!-- Données -->
                <button
                  class="flex items-center gap-2 px-3 py-1.5 rounded-[var(--ui-radius)] text-left text-sm transition-colors w-full"
                  :class="[
                    !store.selectedCardTypeId ? 'opacity-40 cursor-not-allowed text-[var(--ui-text-muted)]' : '',
                    currentView === 'data' && store.selectedCardTypeId
                      ? 'bg-[var(--ui-bg-elevated)] text-[var(--ui-text)] font-medium'
                      : 'text-[var(--ui-text-muted)] hover:bg-[var(--ui-bg-elevated)] hover:text-[var(--ui-text)]'
                  ]"
                  :disabled="!store.selectedCardTypeId"
                  @click="goToData"
                >
                  <UIcon name="i-lucide-table" class="shrink-0 text-xs" />
                  <span>Données</span>
                  <UBadge v-if="store.csvData.length > 0" :label="String(store.csvData.length)" color="primary" variant="subtle" size="xs" class="ml-auto" />
                </button>

                <!-- Galerie -->
                <button
                  class="flex items-center gap-2 px-3 py-1.5 rounded-[var(--ui-radius)] text-left text-sm transition-colors w-full"
                  :class="[
                    !store.csvData.length ? 'opacity-40 cursor-not-allowed text-[var(--ui-text-muted)]' : '',
                    currentView === 'gallery' && store.csvData.length
                      ? 'bg-[var(--ui-bg-elevated)] text-[var(--ui-text)] font-medium'
                      : 'text-[var(--ui-text-muted)] hover:bg-[var(--ui-bg-elevated)] hover:text-[var(--ui-text)]'
                  ]"
                  :disabled="!store.csvData.length"
                  @click="goToGallery"
                >
                  <UIcon name="i-lucide-images" class="shrink-0 text-xs" />
                  <span>Galerie</span>
                </button>
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

            <!-- Vue : Types de cartes -->
            <div v-else-if="currentView === 'cardtypes'" class="space-y-6">
              <CardTypeEditor
                :editing-type="editingCardType"
                @saved="onCardTypeSaved"
                @cancel="editingCardType = null"
              />
            </div>

            <!-- Vue : Données CSV -->
            <div v-else-if="currentView === 'data'" class="space-y-6">
              <CsvUploader />
              <DataWorkbench v-if="store.csvData.length > 0" />
            </div>

            <!-- Vue : Galerie -->
            <CardGallery v-else-if="currentView === 'gallery'" />

            <!-- Vue : Paramètres -->
            <div v-else-if="currentView === 'settings'">
              <UCard variant="outline">
                <template #header>
                  <p class="font-semibold text-sm">Zone de danger</p>
                </template>
                <p class="text-sm text-[var(--ui-text-dimmed)] mb-4">
                  Réinitialiser supprimera tous les projets, types de cartes, données CSV et cartes générées.
                </p>
                <UButton color="error" variant="soft" icon="i-lucide-rotate-ccw" @click="confirmReset">
                  Tout réinitialiser
                </UButton>
              </UCard>
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
  </UApp>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useAuth } from './composables/useAuth.js'
import { useCardsStore } from './stores/cards.js'
import AuthGate from './components/AuthGate.vue'
import CardTypeEditor from './components/CardTypeEditor.vue'
import CsvUploader from './components/CsvUploader.vue'
import DataWorkbench from './components/DataWorkbench.vue'
import CardGallery from './components/CardGallery.vue'
import CardTypeHistory from './components/CardTypeHistory.vue'

const { user: authUser, loading: authLoading, init: initAuth, signOut } = useAuth()
const store = useCardsStore()
const editingCardType = ref(null)
const historyOpen = ref(false)
const historyCardType = ref(null)
const currentView = ref('newproject')
const newProjectName = ref('')

onMounted(() => {
  initAuth()
})

watch(authUser, (user) => {
  if (user) store.init()
})

// Quand les projets sont chargés depuis la DB, naviguer vers le contenu
watch(() => store.projects.length, (len) => {
  if (len > 0 && currentView.value === 'newproject') {
    currentView.value = 'cardtypes'
  }
})

const viewTitle = computed(() => ({
  newproject: 'Projets',
  cardtypes: store.selectedProject
    ? `${store.selectedProject.name} — Types de cartes`
    : 'Types de cartes',
  data: 'Données',
  gallery: 'Galerie & Export',
  settings: 'Paramètres',
}[currentView.value] ?? ''))

function selectProject(id) {
  store.selectProject(id)
  currentView.value = 'cardtypes'
  editingCardType.value = null
}

function deleteProject(id) {
  if (!window.confirm('Supprimer ce projet et toutes ses données ?')) return
  store.deleteProject(id)
  currentView.value = store.projects.length > 0 ? 'cardtypes' : 'newproject'
}

function createProject() {
  const name = newProjectName.value.trim()
  if (!name) return
  store.addProject(name)
  newProjectName.value = ''
  currentView.value = 'cardtypes'
}

function selectCardType(id) {
  store.selectCardType(id)
  currentView.value = 'cardtypes'
  editingCardType.value = null
}

function goToData() {
  if (store.selectedCardTypeId) currentView.value = 'data'
}

function goToGallery() {
  if (store.csvData.length) currentView.value = 'gallery'
}

function addCardType() {
  editingCardType.value = null
  currentView.value = 'cardtypes'
}

function editType(cardType) {
  editingCardType.value = { ...cardType, contentFields: cardType.contentFields?.map((f) => ({ ...f })) }
  currentView.value = 'cardtypes'
}

function onCardTypeSaved() {
  editingCardType.value = null
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
    editingCardType.value = null
    currentView.value = 'newproject'
  }
}
</script>
