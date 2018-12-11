import {store} from '@/store'
import AuthRequest from '@/model/request/AuthRequest'

export const isLogged = () => store.getters['auth/isLogged']
export const getUser = () => store.getters['auth/user']
export const auth = () => store.dispatch('auth/auth')
export const signIn = (model: AuthRequest) => store.dispatch('auth/signIn', model)
export const signOut = () => store.dispatch('auth/signOut', false)
export const signOutWithError = () => store.dispatch('auth/signOut', true)
