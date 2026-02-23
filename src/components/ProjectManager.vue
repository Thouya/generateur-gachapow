<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-folder-open" class="text-lg text-[var(--ui-primary)]" />
          <h3 class="text-lg font-semibold">Projets</h3>
        </div>
        <UBadge v-if="store.projects.length > 0" color="neutral" variant="subtle">
          {{ store.projects.length }} projet{{ store.projects.length > 1 ? 's' : '' }}
        </UBadge>
      </div>
    </template>

    <!-- Liste des projets -->
    <div v-if="store.projects.length > 0" class="flex flex-wrap gap-2 mb-4">
      <UCard
        v-for="project in store.projects"
        :key="project.id"
        class="cursor-pointer transition-all hover:shadow-md"
        :class="store.selectedProjectId === project.id ? 'ring-2 ring-[var(--ui-primary)]' : ''"
        :variant="store.selectedProjectId === project.id ? 'subtle' : 'outline'"
        @click="store.selectProject(project.id)"
      >
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-folder" class="text-base text-[var(--ui-text-dimmed)]" />

          <!-- Mode renommage -->
          <template v-if="renamingId === project.id">
            <UInput
              v-model="renameValue"
              size="xs"
              class="w-24 sm:w-32"
              autofocus
              @keyup.enter="confirmRename"
              @keyup.escape="renamingId = null"
            />
            <UButton size="xs" variant="ghost" icon="i-lucide-check" color="success" @click.stop="confirmRename" />
            <UButton size="xs" variant="ghost" icon="i-lucide-x" @click.stop="renamingId = null" />
          </template>

          <!-- Mode normal -->
          <template v-else>
            <span class="font-semibold text-sm">{{ project.name }}</span>
            <span class="text-[var(--ui-text-dimmed)] text-xs">
              {{ project.cardTypes.length }} type{{ project.cardTypes.length > 1 ? 's' : '' }}
              · {{ project.generatedCards.length }} carte{{ project.generatedCards.length > 1 ? 's' : '' }}
            </span>
            <div v-if="store.selectedProjectId === project.id" class="flex gap-1 ml-1">
              <UButton
                size="xs"
                variant="ghost"
                icon="i-lucide-pencil"
                @click.stop="startRename(project)"
              />
              <UButton
                size="xs"
                variant="ghost"
                color="error"
                icon="i-lucide-trash-2"
                @click.stop="confirmDelete(project)"
              />
            </div>
          </template>
        </div>
      </UCard>
    </div>

    <div v-else class="text-center text-[var(--ui-text-dimmed)] text-sm py-6 mb-4 bg-[var(--ui-bg-elevated)] rounded-[var(--ui-radius)]">
      <UIcon name="i-lucide-folder-plus" class="text-2xl mb-2" />
      <p>Aucun projet. Crée ton premier projet pour commencer.</p>
    </div>

    <!-- Formulaire nouveau projet -->
    <form class="flex items-center gap-2" @submit.prevent="createProject">
      <UInput
        v-model="newProjectName"
        placeholder="Nom du nouveau projet…"
        size="sm"
        icon="i-lucide-plus"
        class="flex-1"
      />
      <UButton
        type="submit"
        icon="i-lucide-plus"
        label="Créer"
        size="sm"
        :disabled="!newProjectName.trim()"
      />
    </form>
  </UCard>
</template>

<script setup>
import { ref } from 'vue'
import { useCardsStore } from '../stores/cards.js'

const store = useCardsStore()

const newProjectName = ref('')
const renamingId = ref(null)
const renameValue = ref('')

function createProject() {
  const name = newProjectName.value.trim()
  if (!name) return
  store.addProject(name)
  newProjectName.value = ''
}

function startRename(project) {
  renamingId.value = project.id
  renameValue.value = project.name
}

function confirmRename() {
  const name = renameValue.value.trim()
  if (name && renamingId.value) {
    store.renameProject(renamingId.value, name)
  }
  renamingId.value = null
}

function confirmDelete(project) {
  if (window.confirm(`Supprimer le projet "${project.name}" et toutes ses données ?`)) {
    store.deleteProject(project.id)
  }
}
</script>
