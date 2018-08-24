import {store} from '@/store'
import Authentication from '@/model/Authentication'

export const isLogged = () => store.getters['auth/isLogged']
export const username = () => store.getters['auth/username']
export const accessKeyId = () => store.getters['auth/accessKeyId']
export const secretAccessKey = () => store.getters['auth/secretAccessKey']
export const auth = () => store.dispatch('auth/auth')
export const signIn = (model: Authentication) => store.dispatch('auth/signIn', model)
export const signOut = () => store.dispatch('auth/signOut', false)
export const signOutWithError = () => store.dispatch('auth/signOut', true)
