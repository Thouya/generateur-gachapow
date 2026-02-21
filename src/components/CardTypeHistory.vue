<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      @click.self="$emit('close')"
    >
      <div
        class="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-lg w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col"
      >
        <!-- Header -->
        <div class="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 class="text-lg font-semibold">
            Historique — {{ cardTypeName }}
          </h3>
          <UButton
            size="xs"
            variant="ghost"
            icon="i-lucide-x"
            @click="$emit('close')"
          />
        </div>

        <!-- Contenu -->
        <div class="overflow-y-auto flex-1 px-5 py-4">
          <div v-if="loadingHistory" class="text-center text-gray-400 py-8">
            <UIcon name="i-lucide-loader-2" class="animate-spin text-2xl" />
          </div>

          <div
            v-else-if="store.cardTypeHistory.length === 0"
            class="text-center text-gray-400 text-sm py-8"
          >
            Aucun historique pour ce type de carte.
          </div>

          <div v-else class="space-y-4">
            <div
              v-for="entry in store.cardTypeHistory"
              :key="entry.id"
              class="relative pl-6 border-l-2"
              :class="borderColor(entry.action)"
            >
              <!-- Dot -->
              <div
                class="absolute -left-[7px] top-1 w-3 h-3 rounded-full"
                :class="dotColor(entry.action)"
              />

              <!-- Action + date -->
              <div class="flex items-center gap-2 mb-1">
                <UBadge
                  :color="badgeColor(entry.action)"
                  size="xs"
                >
                  {{ actionLabel(entry.action) }}
                </UBadge>
                <span class="text-xs text-gray-400">{{ formatDate(entry.createdAt) }}</span>
              </div>

              <!-- Détails des changements -->
              <div
                v-if="entry.action === 'updated' && Object.keys(entry.changes).length > 0"
                class="mt-1 space-y-1"
              >
                <div
                  v-for="(change, field) in entry.changes"
                  :key="field"
                  class="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded px-2 py-1"
                >
                  <span class="font-medium text-gray-700 dark:text-gray-300">{{ fieldLabel(field) }}</span>
                  <span class="mx-1">:</span>
                  <span class="text-red-400 line-through">{{ truncate(String(change.from ?? '')) }}</span>
                  <span class="mx-1 text-gray-300">&rarr;</span>
                  <span class="text-green-500">{{ truncate(String(change.to ?? '')) }}</span>
                </div>
              </div>

              <!-- Snapshot résumé pour création -->
              <div
                v-if="entry.action === 'created'"
                class="text-xs text-gray-400 mt-1"
              >
                {{ entry.snapshot.width }}x{{ entry.snapshot.height }}
                <template v-if="entry.snapshot.contentFields?.length">
                  · {{ entry.snapshot.contentFields.length }} champ(s)
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useCardsStore } from '../stores/cards.js'

const props = defineProps({
  open: Boolean,
  cardTypeId: String,
  cardTypeName: String,
})

defineEmits(['close'])

const store = useCardsStore()
const loadingHistory = ref(false)

watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen && props.cardTypeId) {
      loadingHistory.value = true
      await store.loadHistory(props.cardTypeId)
      loadingHistory.value = false
    }
  }
)

const FIELD_LABELS = {
  name: 'Nom',
  width: 'Largeur',
  height: 'Hauteur',
  backgroundImage: 'Image de fond',
  illustrationImage: 'Illustration',
  overlayImage: 'Overlay',
  illustrationColumn: 'Colonne illustration',
  contentFields: 'Champs de contenu',
}

function fieldLabel(field) {
  return FIELD_LABELS[field] || field
}

function actionLabel(action) {
  if (action === 'created') return 'Créé'
  if (action === 'updated') return 'Modifié'
  if (action === 'deleted') return 'Supprimé'
  return action
}

function badgeColor(action) {
  if (action === 'created') return 'success'
  if (action === 'updated') return 'info'
  if (action === 'deleted') return 'error'
  return 'neutral'
}

function borderColor(action) {
  if (action === 'created') return 'border-green-300 dark:border-green-700'
  if (action === 'updated') return 'border-blue-300 dark:border-blue-700'
  if (action === 'deleted') return 'border-red-300 dark:border-red-700'
  return 'border-gray-300'
}

function dotColor(action) {
  if (action === 'created') return 'bg-green-500'
  if (action === 'updated') return 'bg-blue-500'
  if (action === 'deleted') return 'bg-red-500'
  return 'bg-gray-400'
}

function formatDate(isoString) {
  const d = new Date(isoString)
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function truncate(str, max = 40) {
  return str.length > max ? str.slice(0, max) + '…' : str
}
</script>
