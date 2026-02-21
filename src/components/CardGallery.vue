<template>
  <div class="card-gallery">
    <h3>Cartes générées ({{ cards.length }})</h3>

    <div v-if="cards.length === 0" class="gallery-empty">
      <p>Aucune carte générée. Sélectionne un type de carte, charge un CSV, puis clique sur "Générer".</p>
    </div>

    <div v-else class="gallery-grid">
      <div v-for="card in cards" :key="card.id" class="gallery-item">
        <CardPreview :card-type="getCardType(card.cardTypeId)" :card-data="card.data" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useCardsStore } from '../stores/cards.js'
import CardPreview from './CardPreview.vue'

const store = useCardsStore()

const cards = computed(() => store.generatedCards)

function getCardType(cardTypeId) {
  return store.cardTypes.find((t) => t.id === cardTypeId) || {}
}
</script>

<style scoped>
.card-gallery {
  margin-top: 2rem;
}

.gallery-empty {
  text-align: center;
  color: #888;
  padding: 2rem;
  background: #f5f5f5;
  border-radius: 8px;
}

.gallery-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  padding: 1rem 0;
}

.gallery-item {
  flex-shrink: 0;
}
</style>
