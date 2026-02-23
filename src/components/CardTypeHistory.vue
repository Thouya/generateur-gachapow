<template>
  <UModal v-model:open="isOpen" :title="`Historique — ${cardTypeName}`">
    <template #body>
      <div v-if="loadingHistory" class="text-center text-[var(--ui-text-dimmed)] py-8">
        <UIcon name="i-lucide-loader-2" class="animate-spin text-2xl" />
      </div>

      <div
        v-else-if="store.cardTypeHistory.length === 0"
        class="text-center text-[var(--ui-text-dimmed)] text-sm py-8"
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
            <span class="text-xs text-[var(--ui-text-dimmed)]">{{ formatDate(entry.createdAt) }}</span>
          </div>

          <!-- Détails des changements -->
          <div
            v-if="entry.action === 'updated' && Object.keys(entry.changes).length > 0"
            class="mt-1 space-y-1"
          >
            <div
              v-for="(change, field) in entry.changes"
              :key="field"
              class="text-xs text-[var(--ui-text-muted)] bg-[var(--ui-bg-elevated)] rounded-[var(--ui-radius)] px-2 py-1"
            >
              <span class="font-medium text-[var(--ui-text)]">{{ fieldLabel(field) }}</span>
              <span class="mx-1">:</span>
              <span class="text-red-400 line-through">{{ truncate(String(change.from ?? '')) }}</span>
              <span class="mx-1 text-[var(--ui-text-dimmed)]">&rarr;</span>
              <span class="text-green-500">{{ truncate(String(change.to ?? '')) }}</span>
            </div>
          </div>

          <!-- Snapshot résumé pour création -->
          <div
            v-if="entry.action === 'created'"
            class="text-xs text-[var(--ui-text-dimmed)] mt-1"
          >
            {{ entry.snapshot.width }}×{{ entry.snapshot.height }}
            <template v-if="entry.snapshot.contentFields?.length">
              · {{ entry.snapshot.contentFields.length }} champ(s)
            </template>
          </div>
        </div>
      </div>
    </template>
  </UModal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useCardsStore } from '../stores/cards.js'

const props = defineProps({
  open: Boolean,
  cardTypeId: String,
  cardTypeName: String,
})

const emit = defineEmits(['close'])

const store = useCardsStore()
const loadingHistory = ref(false)

const isOpen = computed({
  get: () => props.open,
  set: (val) => {
    if (!val) emit('close')
  },
})

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
  return 'border-[var(--ui-border)]'
}

function dotColor(action) {
  if (action === 'created') return 'bg-green-500'
  if (action === 'updated') return 'bg-blue-500'
  if (action === 'deleted') return 'bg-red-500'
  return 'bg-[var(--ui-text-dimmed)]'
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
