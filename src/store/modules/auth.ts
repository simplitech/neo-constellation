import { ActionTree, GetterTree, Module, MutationTree } from 'vuex'
import * as types from '@/store/mutation-types'
import { AuthState, RootState } from '@/types/store'
import { $, push, successAndPush, errorAndPush, infoAndPush } from '@/simpli'
import User from '@/model/User'
import Authentication from '@/model/Authentication'
import AWS, { EC2, DynamoDB, S3 } from 'aws-sdk'
import IAM from 'aws-sdk/clients/iam'
import AwsGlobal from '@/model/AwsGlobal'
import {plainToClass, classToPlain, plainToClassFromExist} from 'class-transformer'
import Initializer from '@/app/Initializer'

// initial state
const state: AuthState = {
    user: new User(),
    unauthenticatedPath: undefined,
    eventListener: {
        signIn: [],
        auth: [],
        signOut: [],
    },
}

// getters
const getters: GetterTree<AuthState, RootState> = {
    isLogged: ({ user }) => !!user.accessKeyId && !!user.secretAccessKey,
    user: ({ user }) => user,
    unauthenticatedPath: ({ unauthenticatedPath }) => unauthenticatedPath,
}

// actions
const actions: ActionTree<AuthState, RootState> = {
    /**
     * Sign in account
     * @param state
     * @param commit
     * @param getters
     * @param model format => model: { account, password } (non-encrypted)
     */
    signIn: async ({ state, commit, getters }, model: Authentication) => {

        const { accessKeyId, secretAccessKey } = model
        const user = new User()
        user.accessKeyId = accessKeyId
        user.secretAccessKey = secretAccessKey

        AWS.config.update({ accessKeyId, secretAccessKey })

        AwsGlobal.ec2 = new EC2()
        AwsGlobal.iam = new IAM()
        AwsGlobal.ddb = new DynamoDB.DocumentClient()

        let username: string = $.t('app.anonymous')

        const fetch = async () => {
            await model.validate()

            try {
                const resp = await AwsGlobal.iam.getUser().promise()
                username = resp.User.UserName
            } catch (e) {
                if (e.code === 'InvalidClientTokenId') {
                    errorAndPush('system.error.invalidClientTokenId', '/login', 'httpResponse.403')
                } else if (e.code === 'CredentialsError') {
                    errorAndPush('system.error.invalidCredentials', '/login', 'httpResponse.401')
                } else errorAndPush('system.error.unexpectedError', '/login')
                throw e
            }
        }

        // Show spinner while waiting validation (3000ms delay)
        await $.await.run(fetch, 'login', 3000)

        user.username = username

        localStorage.setItem('user', JSON.stringify(classToPlain(user)))

        commit(types.POPULATE)

        Initializer.init()

        $.snotify.info(username, $.t('system.info.welcome'))

        if (getters.unauthenticatedPath && $.route.name !== 'login') push(getters.unauthenticatedPath)
        else push('/dashboard')

        commit(types.SET_UNAUTHENTICATED_PATH, undefined)

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
    auth: async ({ dispatch, commit, getters, state }) => {
        dispatch('init')
        const { isLogged } = getters

        if (isLogged) {
            state.eventListener.auth.forEach((item) => item())
        } else {
            commit(types.SET_UNAUTHENTICATED_PATH, $.route.path)
            dispatch('signOut', true)
        }
    },

    /**
     * Initializes the module
     * @param commit
     * @param getters
     */
    init: async ({ commit, getters }) => {
        commit(types.POPULATE)
        const { isLogged, user} = getters

        if (isLogged) {
            AWS.config.update({ accessKeyId: user.accessKeyId, secretAccessKey: user.secretAccessKey })
            AwsGlobal.ec2 = new EC2()
            AwsGlobal.s3 = new S3()
            AwsGlobal.iam = new IAM()
        }
    },

    /**
     * Sign out account
     * @param state
     * @param commit
     * @param showError
     */
    signOut: ({ state, commit }, showError: boolean = false) => {
        const accessKeyId = undefined
        const secretAccessKey = undefined
        AWS.config.update({ accessKeyId, secretAccessKey })

        if (showError) errorAndPush('system.error.unauthorized', '/login')
        else push('/login')

        commit(types.FORGET)
        state.eventListener.signOut.forEach((item) => item())
    },

    /**
     * On SignIn Event
     * @param dispatch
     * @param callback
     */
    onSignIn: ({ dispatch }, callback) => dispatch('addEventListener', { name: 'signIn', callback }),

    /**
     * On Auth Event
     * @param dispatch
     * @param callback
     */
    onAuth: ({ dispatch }, callback) => dispatch('addEventListener', { name: 'auth', callback }),

    /**
     * On SignOut Event
     * @param dispatch
     * @param callback
     */
    onSignOut: ({ dispatch }, callback) => dispatch('addEventListener', { name: 'signOut', callback }),

    /**
     * Add event listener
     * @param commit
     * @param payload {name, callback}
     */
    addEventListener: ({ commit }, payload) => commit(types.ADD_EVENT_LISTENER, payload),

    /**
     * Remove event listener
     * @param commit
     * @param payload
     */
    removeEventListener: ({ commit }, payload) => commit(types.REMOVE_EVENT_LISTENER, payload),
}

// mutations
const mutations: MutationTree<AuthState> = {
    // Populate mutation
    [types.POPULATE](state) {

        const userJSON = localStorage.getItem('user')

        const user = userJSON && plainToClassFromExist(new User(), JSON.parse(userJSON)) || null

        if (user) state.user = user

    },
    // Forget mutation
    [types.FORGET](state) {
        state.user = new User()
        localStorage.removeItem('user')
    },
    // Set UnauthenticatedPath mutation
    [types.SET_UNAUTHENTICATED_PATH](state, val) {
        state.unauthenticatedPath = val
    },
    // Add Event Listener mutation
    [types.ADD_EVENT_LISTENER](state, { name, callback }) {
        state.eventListener[name].push(callback)
    },
    // Remove Event Listener mutation
    [types.REMOVE_EVENT_LISTENER](state, { name, callback }) {
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
