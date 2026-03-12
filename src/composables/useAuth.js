import { ref } from 'vue'
import { supabase } from '../utils/supabase.js'

const user = ref(null)
const loading = ref(true)
let initialized = false

export function useAuth() {
  async function init() {
    if (initialized) return
    initialized = true

    loading.value = true
    const {
      data: { session },
    } = await supabase.auth.getSession()
    user.value = session?.user ?? null
    loading.value = false

    supabase.auth.onAuthStateChange((event, session) => {
      // Ne mettre user à null que sur un vrai SIGNED_OUT.
      // TOKEN_REFRESHED / INITIAL_SESSION peuvent arriver sans session
      // temporairement (pendant le refresh) et ne doivent pas déclencher
      // un rechargement complet des données.
      if (event === 'SIGNED_OUT') {
        user.value = null
      } else if (session?.user) {
        user.value = session.user
      }
    })
  }

  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (!error) user.value = null
    return { error }
  }

  return { user, loading, init, signIn, signOut }
}
