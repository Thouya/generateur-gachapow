<template>
  <div class="app">
    <header class="app-header">
      <h1>Générateur Gachapow</h1>
      <p class="app-subtitle">Crée et génère tes cartes de jeu de société</p>
    </header>

    <!-- Barre de types de cartes -->
    <section class="section">
      <div class="section__header">
        <h2>Types de cartes</h2>
      </div>
      <div v-if="store.cardTypes.length === 0" class="empty-state">
        Aucun type de carte. Crée ton premier type ci-dessous.
      </div>
      <div v-else class="card-type-list">
        <button
          v-for="ct in store.cardTypes"
          :key="ct.id"
          class="card-type-btn"
          :class="{ 'card-type-btn--active': store.selectedCardTypeId === ct.id }"
          @click="store.selectCardType(ct.id)"
        >
          <span class="card-type-btn__name">{{ ct.name }}</span>
          <span class="card-type-btn__size">{{ ct.width }}x{{ ct.height }}</span>
          <span class="card-type-btn__actions">
            <button class="btn btn--small" @click.stop="editType(ct)">Modifier</button>
            <button class="btn btn--small btn--danger" @click.stop="store.deleteCardType(ct.id)">&times;</button>
          </span>
        </button>
      </div>
    </section>

    <!-- Éditeur de type de carte (avec FieldMapper intégré) -->
    <section class="section">
      <CardTypeEditor
        :editing-type="editingCardType"
        @saved="editingCardType = null"
        @cancel="editingCardType = null"
      />
    </section>

    <!-- Upload CSV -->
    <section class="section">
      <CsvUploader />
    </section>

    <!-- Actions de génération -->
    <section v-if="store.selectedCardType && store.csvData.length > 0" class="section section--actions">
      <h3>Génération</h3>
      <p class="gen-info">
        Type : <strong>{{ store.selectedCardType.name }}</strong> |
        Données : <strong>{{ store.csvData.length }} lignes</strong>
      </p>
      <div class="gen-actions">
        <button class="btn btn--primary" @click="store.generateCards()">
          Générer les cartes
        </button>
        <button
          v-if="currentTypeCards.length > 0"
          class="btn btn--danger"
          @click="store.clearGeneratedCards(store.selectedCardTypeId)"
        >
          Supprimer les cartes
        </button>
      </div>
    </section>

    <!-- Prévisualisation en direct -->
    <section v-if="store.selectedCardType" class="section">
      <h2>Prévisualisation - {{ store.selectedCardType.name }}</h2>
      <div class="preview-single">
        <CardPreview
          :card-type="store.selectedCardType"
          :card-data="previewData"
        />
      </div>
    </section>

    <!-- Galerie des cartes générées -->
    <section class="section">
      <CardGallery />
    </section>

    <!-- Reset -->
    <section class="section section--bottom">
      <button class="btn btn--danger" @click="confirmReset">Tout réinitialiser</button>
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

<style scoped>
.app-header {
  text-align: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e0e0e0;
}

.app-header h1 {
  margin-bottom: 0.25rem;
  font-size: 2rem;
  color: #1a1a2e;
}

.app-subtitle {
  color: #666;
  margin: 0;
}

.section {
  margin-bottom: 2rem;
}

.section__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.section h2 {
  font-size: 1.2rem;
  margin-bottom: 0.75rem;
}

.section--actions {
  background: #f5f5f5;
  padding: 1rem 1.5rem;
  border-radius: 8px;
}

.section--bottom {
  padding-top: 1rem;
  border-top: 1px solid #e0e0e0;
}

.empty-state {
  color: #888;
  font-size: 0.9rem;
  padding: 0.75rem;
  background: #f5f5f5;
  border-radius: 6px;
  text-align: center;
}

.card-type-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.card-type-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 0.75rem;
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
  text-align: left;
  font-size: 0.9rem;
}

.card-type-btn:hover {
  border-color: #4a90d9;
}

.card-type-btn--active {
  border-color: #4a90d9;
  background: #eef5fc;
}

.card-type-btn__name {
  font-weight: 600;
}

.card-type-btn__size {
  color: #888;
  font-size: 0.8rem;
}

.card-type-btn__actions {
  display: flex;
  gap: 0.25rem;
}

.gen-info {
  font-size: 0.9rem;
  margin-bottom: 0.75rem;
}

.gen-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.preview-single {
  display: flex;
  justify-content: center;
  padding: 1.5rem;
  background: #e8e8e8;
  border-radius: 12px;
}

@media (max-width: 600px) {
  .card-type-list {
    flex-direction: column;
  }
}
</style>
