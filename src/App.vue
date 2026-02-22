<template>
  <!-- Chargement auth -->
  <div v-if="authLoading" class="min-h-screen flex items-center justify-center">
    <UIcon name="i-lucide-loader-2" class="text-4xl animate-spin text-gray-400" />
  </div>

  <!-- Non connecté -->
  <AuthGate v-else-if="!authUser" />

  <!-- Connecté -->
  <div v-else class="max-w-5xl mx-auto px-4 py-6">
    <!-- Header -->
    <header class="relative text-center mb-8 pb-4 border-b-2 border-gray-200 dark:border-gray-700">
      <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1">Générateur Gachapow</h1>
      <p class="text-sm sm:text-base text-gray-500">Crée et génère tes cartes de jeu de société</p>
      <UButton
        class="absolute top-0 right-0"
        size="sm"
        variant="ghost"
        icon="i-lucide-log-out"
        @click="handleLogout"
      />
    </header>

    <!-- Chargement données -->
    <div v-if="store.loading" class="text-center text-gray-400 py-16">
      <UIcon name="i-lucide-loader-2" class="text-4xl animate-spin mb-3" />
      <p>Chargement des données…</p>
    </div>

    <template v-else>
    <!-- Sélecteur de projet -->
    <section class="mb-8">
      <ProjectManager />
    </section>

    <!-- Contenu du projet (visible uniquement quand un projet est sélectionné) -->
    <template v-if="store.selectedProject">
      <!-- Barre de types de cartes -->
      <section class="mb-8">
        <h2 class="text-xl font-semibold mb-3">Types de cartes</h2>

        <div v-if="store.cardTypes.length === 0" class="text-center text-gray-400 text-sm py-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          Aucun type de carte. Crée ton premier type ci-dessous.
        </div>

        <div v-else class="flex flex-wrap gap-2">
          <div
            v-for="ct in store.cardTypes"
            :key="ct.id"
            class="flex items-center gap-3 px-3 py-2 rounded-lg border-2 cursor-pointer transition-all text-sm"
            :class="store.selectedCardTypeId === ct.id
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-950'
              : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-primary-300'"
            @click="store.selectCardType(ct.id)"
          >
            <span class="font-semibold">{{ ct.name }}</span>
            <span class="text-gray-400 text-xs">{{ ct.width }}x{{ ct.height }}</span>
            <div class="flex gap-1">
              <UButton size="xs" variant="soft" @click.stop="editType(ct)">Modifier</UButton>
              <UButton size="xs" variant="ghost" icon="i-lucide-history" @click.stop="openHistory(ct)" />
              <UButton size="xs" variant="soft" color="error" icon="i-lucide-x" @click.stop="store.deleteCardType(ct.id)" />
            </div>
          </div>
        </div>
      </section>

      <!-- Éditeur de type de carte -->
      <section class="mb-8">
        <CardTypeEditor
          :editing-type="editingCardType"
          @saved="editingCardType = null"
          @cancel="editingCardType = null"
        />
      </section>

      <!-- Upload CSV -->
      <section class="mb-8">
        <CsvUploader />
      </section>

      <!-- Atelier de données (table éditable + aperçu live) -->
      <section v-if="store.csvData.length > 0" class="mb-8">
        <DataWorkbench />
      </section>

      <!-- Galerie des cartes générées -->
      <section class="mb-8">
        <CardGallery />
      </section>

      <!-- Reset -->
      <section class="pt-4 border-t border-gray-200 dark:border-gray-700">
        <UButton color="error" variant="soft" icon="i-lucide-rotate-ccw" @click="confirmReset">
          Tout réinitialiser
        </UButton>
      </section>
    </template>
    </template>

    <!-- Modal historique -->
    <CardTypeHistory
      :open="historyOpen"
      :card-type-id="historyCardType?.id"
      :card-type-name="historyCardType?.name"
      @close="historyOpen = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useAuth } from './composables/useAuth.js'
import { useCardsStore } from './stores/cards.js'
import AuthGate from './components/AuthGate.vue'
import ProjectManager from './components/ProjectManager.vue'
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

onMounted(() => {
  initAuth()
})

// Charger les données du store quand l'utilisateur est authentifié
watch(authUser, (user) => {
  if (user) store.init()
})

function editType(cardType) {
  editingCardType.value = { ...cardType, contentFields: cardType.contentFields?.map((f) => ({ ...f })) }
}

function openHistory(ct) {
  historyCardType.value = ct
  historyOpen.value = true
}

function handleLogout() {
  signOut()
}

function confirmReset() {
  if (window.confirm('Supprimer tous les projets, types de cartes, données CSV et cartes générées ?')) {
    store.resetAll()
    editingCardType.value = null
  }
}
</script>
