<template>
  <Teleport to="body">
    <Transition name="confirm-fade">
      <div
        v-if="pending"
        class="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      >
        <!-- Backdrop -->
        <div
          class="absolute inset-0 bg-black/50 backdrop-blur-sm"
          @click="_cancel"
        />

        <!-- Boîte de dialogue -->
        <div
          class="relative z-10 bg-[var(--ui-bg)] rounded-xl shadow-2xl border border-[var(--ui-border)] w-full max-w-sm p-6 flex flex-col gap-5"
          @click.stop
        >
          <!-- Icône + texte -->
          <div class="flex items-start gap-3">
            <div class="shrink-0 w-9 h-9 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <UIcon name="i-lucide-triangle-alert" class="text-lg text-red-500" />
            </div>
            <div class="pt-0.5">
              <p class="font-semibold text-[var(--ui-text)]">{{ pending.title }}</p>
              <p v-if="pending.message" class="text-sm text-[var(--ui-text-muted)] mt-1 leading-snug">
                {{ pending.message }}
              </p>
            </div>
          </div>

          <!-- Boutons -->
          <div class="flex gap-2 justify-end">
            <UButton variant="soft" color="neutral" @click="_cancel">
              Annuler
            </UButton>
            <UButton :color="pending.confirmColor || 'error'" @click="_accept">
              {{ pending.confirmLabel || 'Supprimer' }}
            </UButton>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { useConfirm } from '../composables/useConfirm.js'

const { pending, _accept, _cancel } = useConfirm()
</script>

<style scoped>
.confirm-fade-enter-active,
.confirm-fade-leave-active {
  transition: opacity 0.15s ease;
}
.confirm-fade-enter-from,
.confirm-fade-leave-to {
  opacity: 0;
}
</style>
