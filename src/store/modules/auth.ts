import {ActionTree, GetterTree, Module, MutationTree} from 'vuex'
import AWS from 'aws-sdk'
import {AuthState, RootState} from '@/types/store'
import {$, push, error} from '@/simpli'
import User from '@/model/User'
import AuthRequest from '@/model/request/AuthRequest'
import AwsGlobal from '@/model/AwsGlobal'
import Initializer from '@/app/Initializer'
import NetworkV2 from '@/model/Network.v2'
import ApplicationBlueprint from '@/model/ApplicationBlueprint'
import Stack from '@/model/Stack'

// initial state
const state: AuthState = {
  accessKeyId: null,
  secretAccessKey: null,

  user: new User(),

  networks: [],
  appBlueprints: [],
  stacks: [],

  cachePath: null,
  eventListener: {
    signIn: [],
    auth: [],
    signOut: [],
  },
}

// getters
const getters: GetterTree<AuthState, RootState> = {
  isLogged: ({accessKeyId, secretAccessKey}) => !!accessKeyId && !!secretAccessKey,
  accessKeyId: ({accessKeyId}) => accessKeyId,
  secretAccessKey: ({secretAccessKey}) => secretAccessKey,

  user: ({user}) => user,

  networks: ({networks}) => networks,
  appBlueprints: ({appBlueprints}) => appBlueprints,
  stacks: ({stacks}) => stacks,

  cachePath: ({cachePath}) => cachePath,
}

// actions
const actions: ActionTree<AuthState, RootState> = {
  /**
   * Sign in account
   * @param state
   * @param commit
   * @param getters
   * @param request
   */
  signIn: async ({state, commit, getters}, request: AuthRequest) => {
    const {accessKeyId, secretAccessKey} = request

    AWS.config.update({accessKeyId, secretAccessKey})
    AwsGlobal.reset()

    const user = new User(accessKeyId, secretAccessKey)
    // Populate user from AWS IAM
    await user.populate()

    localStorage.setItem('accessKeyId', accessKeyId)
    localStorage.setItem('secretAccessKey', secretAccessKey)

    commit('POPULATE_USER', user)

    Initializer.init()

    $.snotify.info(user.username, $.t('system.info.welcome'))

    const uri = getters.cachePath && $.route.name !== 'signIn' ? getters.cachePath : '/dashboard'
    push(uri)

    commit('SET_CACHE_PATH', undefined)

    state.eventListener.signIn.forEach((item) => item())
  },

  /**
   * Verifies authorization and refresh user info.
   * Note: If it is not logged then dispatches signOut
   * @param dispatch
   * @param commit
   * @param getters
   * @param state
   */
  auth: async ({dispatch, commit, getters, state}) => {
    dispatch('init')

    const {isLogged, accessKeyId, secretAccessKey} = getters

    if (isLogged) {
      const user = new User(accessKeyId, secretAccessKey)
      // Populate user from AWS IAM
      await user.populate()

      commit('POPULATE_USER', user)

      state.eventListener.auth.forEach((item) => item())
    } else {
      error('system.error.unauthorized')
      commit('SET_CACHE_PATH', $.route.path)
      dispatch('signOut')
    }
  },

  /**
   * Initializes the module
   * @param commit
   * @param getters
   */
  init: ({commit, getters}) => {
    commit('POPULATE_CREDENTIALS')

    const {accessKeyId, secretAccessKey} = getters

    if (getters.isLogged) {
      AWS.config.update({accessKeyId, secretAccessKey})
      AwsGlobal.reset()
    }
  },

  /**
   * Sign out account
   * @param state
   * @param commit
   */
  signOut: ({state, commit}) => {
    const accessKeyId = undefined
    const secretAccessKey = undefined
    AWS.config.update({accessKeyId, secretAccessKey})

    push('/sign-in')

    commit('FORGET')
    state.eventListener.signOut.forEach((item) => item())
  },

  /**
   * Synchronize all networks
   * @param state
   * @param commit
   */
  syncNetworks: async ({state, commit}) => {
    commit('POPULATE_NETWORKS', await new NetworkV2().list())
  },

  /**
   * Synchronize all Application Blueprints
   * @param state
   * @param commit
   */
  syncAppBlueprints: async ({state, commit}) => {
    commit('POPULATE_APP_BLUEPRINTS', await new ApplicationBlueprint().list())
  },

  /**
   * Synchronize all Stacks
   * @param state
   * @param commit
   */
  syncStacks: async ({state, commit}) => {
    commit('POPULATE_STACKS', await new Stack().list())
  },

  /**
   * On SignIn Event
   * @param dispatch
   * @param callback
   */
  onSignIn: ({dispatch}, callback) => dispatch('addEventListener', {name: 'signIn', callback}),

  /**
   * On Auth Event
   * @param dispatch
   * @param callback
   */
  onAuth: ({dispatch}, callback) => dispatch('addEventListener', {name: 'auth', callback}),

  /**
   * On SignOut Event
   * @param dispatch
   * @param callback
   */
  onSignOut: ({dispatch}, callback) => dispatch('addEventListener', {name: 'signOut', callback}),

  /**
   * Add event listener
   * @param commit
   * @param payload {name, callback}
   */
  addEventListener: ({commit}, payload) => commit('ADD_EVENT_LISTENER', payload),

  /**
   * Remove event listener
   * @param commit
   * @param payload
   */
  removeEventListener: ({commit}, payload) => commit('REMOVE_EVENT_LISTENER', payload),
}

// mutations
const mutations: MutationTree<AuthState> = {
  // Populate credentials mutation
  POPULATE_CREDENTIALS(state) {
    state.accessKeyId = localStorage.getItem('accessKeyId') || null
    state.secretAccessKey = localStorage.getItem('secretAccessKey') || null
  },

  // Populate user mutation
  POPULATE_USER(state, user: User) {
    state.user = user
  },

  // Populate networks mutation
  POPULATE_NETWORKS(state, networks: NetworkV2[]) {
    state.networks = networks
  },

  // Populate appBlueprints mutation
  POPULATE_APP_BLUEPRINTS(state, appBlueprints: ApplicationBlueprint[]) {
    state.appBlueprints = appBlueprints
  },

  // Populate stacks mutation
  POPULATE_STACKS(state, stacks: Stack[]) {
    state.stacks = stacks
  },

  // Forget mutation
  FORGET(state) {
    state.accessKeyId = null
    state.secretAccessKey = null

    state.user = new User()

    state.networks = []
    state.appBlueprints = []
    state.stacks = []

    localStorage.removeItem('accessKeyId')
    localStorage.removeItem('secretAccessKey')

    AWS.config.update({})
  },

  // Set cachePath mutation
  SET_CACHE_PATH(state, val) {
    state.cachePath = val
  },

  // Add Event Listener mutation
  ADD_EVENT_LISTENER(state, {name, callback}) {
    state.eventListener[name].push(callback)
  },

  // Remove Event Listener mutation
  REMOVE_EVENT_LISTENER(state, {name, callback}) {
    if (callback) {
      const index = state.eventListener[name].findIndex((item) => item === callback)
      state.eventListener[name].splice(index, 1)
    } else {
      state.eventListener[name] = []
    }
  },
}

const namespaced: boolean = true
export const auth: Module<AuthState, RootState> = {
  namespaced,
  state,
  getters,
  actions,
  mutations,
}
