import {store} from '@/store'

export const getVersion = () => store.getters.version as string
export const getLanguage = () => store.getters.language as string
export const getCurrency = () => store.getters.currency as string
export const getExtension = () => store.getters.extension as string
