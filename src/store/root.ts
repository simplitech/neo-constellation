import {ActionTree, GetterTree, MutationTree} from 'vuex'
import {$, Lang, Currency} from '@/simpli'
import * as types from '@/store/mutation-types'
import {RootState} from '@/types/store'
import {defaultCurrency, defaultLang} from '@/config/locale.config'
import moment from 'moment'
const app = require('../../package.json')

// initial root state
export const state: RootState = {
  version: app.version,
  language: defaultLang,
  currency: defaultCurrency,
  year: moment().year(),
  extension: '.json',
}

// root getters
export const getters: GetterTree<RootState, RootState> = {
  version: ({version}) => version,
  language: ({language}) => language,
  currency: ({currency}) => currency,
  year: ({year}) => year,
  extension: ({extension}) => extension,
}

// root actions
export const actions: ActionTree<RootState, RootState> = {
  /**
   * Change app language
   * @param commit
   * @param val
   */
  setLang: ({commit}, val: Lang) => {
    localStorage.setItem('lang', val)
    $.i18n.locale = val
    commit(types.SET_LANG, val)
  },

  /**
   * Change app language from query
   * Note: you need to place setLang func into a watch from $.route.query.lang
   * @param commit
   * @param state
   * @param language
   */
  queryLang({commit, state}, language?: string) {
    let lang = language
    if (!language) lang = state.language
    const query = Object.assign({}, $.route.query, {lang})
    if (lang) $.router.replace({query})
  },

  /**
   * Change app currency
   * @param commit
   * @param val
   */
  setCurrency: ({commit}, val: Currency) => {
    commit(types.SET_CURRENCY, val)
  },
}

// root mutations
export const mutations: MutationTree<RootState> = {
  // Set Lang mutation
  [types.SET_LANG](state, val) {
    state.language = val
  },
  // Set Currency mutation
  [types.SET_CURRENCY](state, val) {
    state.currency = val
  },
}
