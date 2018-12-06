import {store} from '@/store'
import Authentication from '@/model/Authentication'

export const isLogged = () => store.getters['auth/isLogged']
export const getUser = () => store.getters['auth/user']
export const auth = () => store.dispatch('auth/auth')
export const signIn = (model: Authentication) => store.dispatch('auth/signIn', model)
export const signOut = () => store.dispatch('auth/signOut', false)
export const signOutWithError = () => store.dispatch('auth/signOut', true)
