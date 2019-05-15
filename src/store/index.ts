import Vue from 'vue'
import Vuex, {StoreOptions} from 'vuex'
import {RootState} from '@/types/store'
import {actions, getters, mutations, state} from '@/store/root'
import {auth} from '@/store/modules/auth'

Vue.use(Vuex)

const setup: StoreOptions<RootState> = {
  state, // root state
  getters, // root getters
  actions, // root actions
  mutations, // root mutations
  modules: {
    auth,
  },
  strict: false,
}

export const store = new Vuex.Store<RootState>(setup)
