<template>
  <UApp>
    <!-- Chargement auth -->
    <div v-if="authLoading" class="min-h-screen flex items-center justify-center">
      <UIcon name="i-lucide-loader-2" class="text-4xl animate-spin text-[var(--ui-text-dimmed)]" />
    </div>

    <!-- Non connecté -->
    <AuthGate v-else-if="!authUser" />

    <!-- Connecté -->
    <template v-else>
      <UHeader>
        <template #left>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-sparkles" class="text-xl text-[var(--ui-primary)]" />
            <span class="text-lg font-bold">Gachapow</span>
          </div>
        </template>

        <template #right>
          <UColorModeButton />
          <UButton
            size="sm"
            variant="ghost"
            color="neutral"
            icon="i-lucide-log-out"
            @click="handleLogout"
          />
        </template>
      </UHeader>

      <UMain>
        <UContainer>
          <!-- Chargement données -->
          <div v-if="store.loading" class="text-center text-[var(--ui-text-dimmed)] py-16">
            <UIcon name="i-lucide-loader-2" class="text-4xl animate-spin mb-3" />
            <p>Chargement des données…</p>
          </div>

          <div v-else class="space-y-8 py-6">
            <!-- Sélecteur de projet -->
            <section>
              <ProjectManager />
            </section>

            <!-- Contenu du projet -->
            <template v-if="store.selectedProject">
              <!-- Types de cartes -->
              <section>
                <div class="flex items-center justify-between mb-4">
                  <h2 class="text-xl font-semibold">Types de cartes</h2>
                </div>

                <div v-if="store.cardTypes.length === 0" class="text-center text-[var(--ui-text-dimmed)] text-sm py-6 bg-[var(--ui-bg-elevated)] rounded-[var(--ui-radius)]">
                  Aucun type de carte. Crée ton premier type ci-dessous.
                </div>

                <div v-else class="flex flex-wrap gap-2">
                  <UCard
                    v-for="ct in store.cardTypes"
                    :key="ct.id"
                    class="cursor-pointer transition-all hover:shadow-md"
                    :class="store.selectedCardTypeId === ct.id ? 'ring-2 ring-[var(--ui-primary)]' : ''"
                    :variant="store.selectedCardTypeId === ct.id ? 'subtle' : 'outline'"
                    @click="store.selectCardType(ct.id)"
                  >
                    <div class="flex items-center gap-3">
                      <div>
                        <span class="font-semibold text-sm">{{ ct.name }}</span>
                        <span class="text-[var(--ui-text-dimmed)] text-xs ml-2">{{ ct.width }}×{{ ct.height }}</span>
                      </div>
                      <div class="flex gap-1">
                        <UButton size="xs" variant="soft" icon="i-lucide-pencil" @click.stop="editType(ct)" />
                        <UButton size="xs" variant="ghost" icon="i-lucide-history" @click.stop="openHistory(ct)" />
                        <UButton size="xs" variant="soft" color="error" icon="i-lucide-x" @click.stop="store.deleteCardType(ct.id)" />
                      </div>
                    </div>
                  </UCard>
                </div>
              </section>

              <!-- Éditeur de type de carte -->
              <section>
                <CardTypeEditor
                  :editing-type="editingCardType"
                  @saved="editingCardType = null"
                  @cancel="editingCardType = null"
                />
              </section>

              <!-- Upload CSV -->
              <section>
                <CsvUploader />
              </section>

              <!-- Atelier de données -->
              <section v-if="store.csvData.length > 0">
                <DataWorkbench />
              </section>

              <!-- Galerie des cartes générées -->
              <section>
                <CardGallery />
              </section>

              <!-- Reset -->
              <USeparator class="my-2" />
              <section>
                <UButton color="error" variant="soft" icon="i-lucide-rotate-ccw" @click="confirmReset">
                  Tout réinitialiser
                </UButton>
              </section>
            </template>
          </div>
        </UContainer>
      </UMain>

      <!-- Modal historique -->
      <CardTypeHistory
        :open="historyOpen"
        :card-type-id="historyCardType?.id"
        :card-type-name="historyCardType?.name"
        @close="historyOpen = false"
      />
    </template>
  </UApp>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
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
