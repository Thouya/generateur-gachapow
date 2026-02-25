import { ref } from 'vue'

// Singleton : une seule instance partagée dans toute l'app
const pending = ref(null)
// pending = { title, message, confirmLabel, confirmColor, resolve }

export function useConfirm() {
  /**
   * Affiche un dialogue de confirmation.
   * Retourne une Promise<boolean> : true = confirmé, false = annulé.
   *
   * Options :
   *   title        – titre du dialogue        (défaut : 'Confirmer')
   *   message      – message de détail        (optionnel)
   *   confirmLabel – texte du bouton valider  (défaut : 'Supprimer')
   *   confirmColor – couleur Nuxt UI du bouton (défaut : 'error')
   */
  function confirm({
    title = 'Confirmer',
    message = '',
    confirmLabel = 'Supprimer',
    confirmColor = 'error',
  } = {}) {
    return new Promise((resolve) => {
      pending.value = { title, message, confirmLabel, confirmColor, resolve }
    })
  }

  function _accept() {
    pending.value?.resolve(true)
    pending.value = null
  }

  function _cancel() {
    pending.value?.resolve(false)
    pending.value = null
  }

  return { pending, confirm, _accept, _cancel }
}
