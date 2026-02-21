<template>
  <div class="max-w-5xl mx-auto px-4 py-6">
    <!-- Header -->
    <header class="text-center mb-8 pb-4 border-b-2 border-gray-200 dark:border-gray-700">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-1">Générateur Gachapow</h1>
      <p class="text-gray-500">Crée et génère tes cartes de jeu de société</p>
    </header>

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

    <!-- Actions de génération -->
    <section v-if="store.selectedCardType && store.csvData.length > 0" class="mb-8">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Génération</h3>
        </template>
        <p class="text-sm mb-3">
          Type : <strong>{{ store.selectedCardType.name }}</strong> |
          Données : <strong>{{ store.csvData.length }} lignes</strong>
        </p>
        <div class="flex gap-2 flex-wrap">
          <UButton color="primary" icon="i-lucide-sparkles" @click="store.generateCards()">
            Générer les cartes
          </UButton>
          <UButton
            v-if="currentTypeCards.length > 0"
            color="error"
            variant="soft"
            icon="i-lucide-trash-2"
            @click="store.clearGeneratedCards(store.selectedCardTypeId)"
          >
            Supprimer les cartes
          </UButton>
        </div>
      </UCard>
    </section>

    <!-- Prévisualisation en direct -->
    <section v-if="store.selectedCardType" class="mb-8">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Prévisualisation - {{ store.selectedCardType.name }}</h3>
        </template>
        <div class="flex justify-center p-6 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <CardPreview
            :card-type="store.selectedCardType"
            :card-data="previewData"
          />
        </div>
      </UCard>
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useCardsStore } from './stores/cards.js'
import CardTypeEditor from './components/CardTypeEditor.vue'
import CsvUploader from './components/CsvUploader.vue'
import CardPreview from './components/CardPreview.vue'
import CardGallery from './components/CardGallery.vue'

const store = useCardsStore()
const editingCardType = ref(null)

onMounted(() => {
  store.init()
})

const previewData = computed(() => {
  if (store.csvData.length > 0) {
    return store.csvData[0]
  }
  return {}
})

const currentTypeCards = computed(() =>
  store.generatedCards.filter((c) => c.cardTypeId === store.selectedCardTypeId)
)

function editType(cardType) {
  editingCardType.value = { ...cardType, contentFields: cardType.contentFields?.map((f) => ({ ...f })) }
}

function confirmReset() {
  if (window.confirm('Supprimer tous les types de cartes, données CSV et cartes générées ?')) {
    store.resetAll()
    editingCardType.value = null
  }
}
</script>
