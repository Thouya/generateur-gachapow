<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold">Cartes générées</h3>
        <UBadge v-if="cards.length > 0" color="primary" variant="subtle">
          {{ cards.length }} cartes
        </UBadge>
      </div>
    </template>

    <div v-if="cards.length === 0" class="text-center text-gray-400 py-8">
      <UIcon name="i-lucide-layers" class="text-4xl mb-3" />
      <p>Aucune carte générée. Sélectionne un type de carte, charge un CSV, puis clique sur "Générer".</p>
    </div>

    <div v-else class="flex flex-wrap gap-6 p-4">
      <div v-for="card in cards" :key="card.id" class="flex-shrink-0">
        <CardPreview :card-type="getCardType(card.cardTypeId)" :card-data="card.data" />
      </div>
    </div>
  </UCard>
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
