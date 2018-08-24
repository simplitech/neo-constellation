/** Use this space to create your own custom helper
 * Note1: your custom helper can be accessed in '@/simpli'
 * Note2: be sure the name you have chosen does not exist in simpli-ts-vue
 */
import {$, error} from '@/simpli'

export const abort = (msg: string) => {
  error(msg) // display error in a toast
  throw new Error($.t(msg))
}

export const back = () => window.history.back()

export const random = () => Math.random()
