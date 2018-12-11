import {ActionTree, GetterTree, Module, MutationTree} from 'vuex'
import {AuthState, RootState} from '@/types/store'
import {$, push, successAndPush, errorAndPush, infoAndPush} from '@/simpli'
import User from '@/model/User'
import AuthRequest from '@/model/request/AuthRequest'
import AWS, {EC2, DynamoDB, S3} from 'aws-sdk'
import IAM from 'aws-sdk/clients/iam'
import AwsGlobal from '@/model/AwsGlobal'
import {plainToClass, classToPlain, plainToClassFromExist} from 'class-transformer'
import Initializer from '@/app/Initializer'
import NetworkV2 from '@/model/Network.v2'
import ApplicationBlueprint from '@/model/ApplicationBlueprint'

// initial state
const state: AuthState = {
  accessKeyId: null,
  secretAccessKey: null,
  user: new User(),
  networks: [],
  appBlueprints: [],
  // stacks: Stack[],
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

    commit('POPULATE', user)

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

      commit('POPULATE', user)

      state.eventListener.auth.forEach((item) => item())
    } else {
      commit('SET_CACHE_PATH', $.route.path)
      dispatch('signOut', true)
    }
  },

  /**
   * Initializes the module
   * @param commit
   * @param getters
   */
  init: async ({commit, getters}) => {
    commit('POPULATE_CREDENTIALS')

    const {isLogged, accessKeyId, secretAccessKey} = getters

    if (isLogged) {
      AWS.config.update({accessKeyId, secretAccessKey})
      AwsGlobal.reset()
    }
  },

  /**
   * Sign out account
   * @param state
   * @param commit
   * @param showError
   */
  signOut: ({state, commit}, showError: boolean = false) => {
    const accessKeyId = undefined
    const secretAccessKey = undefined
    AWS.config.update({accessKeyId, secretAccessKey})

    if (showError) errorAndPush('system.error.unauthorized', '/sign-in')
    else push('/sign-in')

    commit('FORGET')
    state.eventListener.signOut.forEach((item) => item())
  },

  /**
   * Synchronize all networks
   * @param state
   * @param commit
   */
  syncNetworks: ({state, commit}) => {
    // await NetworkV2.list()
  },

  /**
   * Synchronize all Application Blueprints
   * @param state
   * @param commit
   */
  syncAppBlueprints: ({state, commit}) => {
    // await ApplicationBlueprint.list()
  },

  /**
   * Synchronize all Stacks
   * @param state
   * @param commit
   */
  syncStacks: ({state, commit}) => {
    // await Stacks.list()
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
  POPULATE(state, user: User) {
    state.user = user
  },

  // Forget mutation
  FORGET(state) {
    state.user = new User()
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
