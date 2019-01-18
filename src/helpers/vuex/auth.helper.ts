import {store} from '@/store'
import AuthRequest from '@/model/request/AuthRequest'
import Network from '@/model/Network'
import ApplicationBlueprint from '@/model/ApplicationBlueprint'
import Stack from '@/model/Stack'
import User from '@/model/User'

export const isLogged = () => store.getters['auth/isLogged'] as boolean
export const getUser = () => store.getters['auth/user'] as User

export const getNetworks = () => store.getters['auth/networks'] as Network[]
export const getAppBlueprints = () => store.getters['auth/appBlueprints'] as ApplicationBlueprint[]
export const getStacks = () => store.getters['auth/stacks'] as Stack[]

export const init = () => store.dispatch('auth/init')
export const auth = () => store.dispatch('auth/auth')
export const signIn = (model: AuthRequest) => store.dispatch('auth/signIn', model)
export const signOut = () => store.dispatch('auth/signOut')

export const syncNetworks = () => store.dispatch('auth/syncNetworks')
export const syncAppBlueprints = () => store.dispatch('auth/syncAppBlueprints')
export const syncStacks = () => store.dispatch('auth/syncStacks')
