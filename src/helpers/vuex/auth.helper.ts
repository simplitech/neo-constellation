import {store} from '@/store'
import AuthRequest from '@/model/request/AuthRequest'
import User from '@/model/User'

export const isLogged = () => store.getters['auth/isLogged'] as boolean
export const getUser = () => store.getters['auth/user'] as User

export const init = () => store.dispatch('auth/init')
export const auth = () => store.dispatch('auth/auth')
export const signIn = (model: AuthRequest) => store.dispatch('auth/signIn', model)
export const signOut = () => store.dispatch('auth/signOut')

export const syncNetworks = () => store.dispatch('auth/syncNetworks')
export const syncAppBlueprints = () => store.dispatch('auth/syncAppBlueprints')
export const syncStacks = () => store.dispatch('auth/syncStacks')
