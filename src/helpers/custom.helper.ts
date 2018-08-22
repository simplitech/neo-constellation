/** Use this space to create your own custom helper
 * Note1: your custom helper can be accessed in '@/simpli'
 * Note2: be sure the name you have chosen does not exist in simpli-ts-vue
 */
import {store} from '@/store'

export const isLogged = () => store.getters['auth/isLogged']
export const accessKeyId = () => store.getters['auth/accessKeyId']
export const secretAccessKey = () => store.getters['auth/secretAccessKey']

export const random = () => Math.random()
