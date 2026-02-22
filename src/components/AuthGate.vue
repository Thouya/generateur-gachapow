<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
    <div class="w-full max-w-sm">
      <div class="text-center mb-8">
        <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1">Générateur Gachapow</h1>
        <p class="text-sm sm:text-base text-gray-500">Connecte-toi pour accéder à tes projets</p>
      </div>

      <UCard>
        <template #header>
          <h2 class="text-lg font-semibold text-center">
            {{ isSignUp ? 'Inscription' : 'Connexion' }}
          </h2>
        </template>

        <form class="space-y-4" @submit.prevent="handleSubmit">
          <UFormField label="Email">
            <UInput v-model="email" type="email" placeholder="ton@email.com" icon="i-lucide-mail" required />
          </UFormField>

          <UFormField label="Mot de passe">
            <UInput v-model="password" type="password" placeholder="••••••••" icon="i-lucide-lock" required />
          </UFormField>

          <div v-if="errorMsg" class="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
            {{ errorMsg }}
          </div>

          <div v-if="successMsg" class="text-sm text-green-600 bg-green-50 dark:bg-green-900/20 rounded-lg px-3 py-2">
            {{ successMsg }}
          </div>

          <UButton type="submit" color="primary" block :loading="submitting">
            {{ isSignUp ? "S'inscrire" : 'Se connecter' }}
          </UButton>
        </form>

        <template #footer>
          <p class="text-sm text-center text-gray-500">
            {{ isSignUp ? 'Déjà un compte ?' : 'Pas encore de compte ?' }}
            <button
              type="button"
              class="text-primary-500 hover:underline font-medium cursor-pointer"
              @click="toggleMode"
            >
              {{ isSignUp ? 'Se connecter' : "S'inscrire" }}
            </button>
          </p>
        </template>
      </UCard>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuth } from '../composables/useAuth.js'

const { signIn, signUp } = useAuth()

const isSignUp = ref(false)
const email = ref('')
const password = ref('')
const errorMsg = ref('')
const successMsg = ref('')
const submitting = ref(false)

function toggleMode() {
  isSignUp.value = !isSignUp.value
  errorMsg.value = ''
  successMsg.value = ''
}

async function handleSubmit() {
  errorMsg.value = ''
  successMsg.value = ''
  submitting.value = true

  try {
    if (isSignUp.value) {
      const { data, error } = await signUp(email.value, password.value)
      if (error) {
        errorMsg.value = translateError(error.message)
      } else if (data?.user && !data.session) {
        successMsg.value = 'Vérifie ta boîte mail pour confirmer ton inscription.'
      }
    } else {
      const { error } = await signIn(email.value, password.value)
      if (error) {
        errorMsg.value = translateError(error.message)
      }
    }
  } finally {
    submitting.value = false
  }
}

function translateError(msg) {
  if (msg.includes('Invalid login credentials')) return 'Email ou mot de passe incorrect.'
  if (msg.includes('Email not confirmed')) return 'Confirme ton email avant de te connecter.'
  if (msg.includes('User already registered')) return 'Un compte existe déjà avec cet email.'
  if (msg.includes('Password should be at least')) return 'Le mot de passe doit faire au moins 6 caractères.'
  return msg
}
</script>
