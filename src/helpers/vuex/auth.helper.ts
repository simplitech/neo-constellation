import {store} from '@/store'
import AuthRequest from '@/model/request/AuthRequest'

export const isLogged = () => store.getters['auth/isLogged']
export const getUser = () => store.getters['auth/user']

export const getNetworks = () => store.getters['auth/networks']
export const getAppBlueprints = () => store.getters['auth/appBlueprints']
export const getStacks = () => store.getters['auth/stacks']

export const auth = () => store.dispatch('auth/auth')
export const signIn = (model: AuthRequest) => store.dispatch('auth/signIn', model)
export const signOut = () => store.dispatch('auth/signOut')
