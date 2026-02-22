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

    supabase.auth.onAuthStateChange((_event, session) => {
      user.value = session?.user ?? null
    })
  }

  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  async function signUp(email, password) {
    const { data, error } = await supabase.auth.signUp({ email, password })
    return { data, error }
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (!error) user.value = null
    return { error }
  }

  return { user, loading, init, signIn, signUp, signOut }
}
