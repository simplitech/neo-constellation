import {ID, Currency, Lang} from '@/simpli'

/**
 * Root
 */
export interface RootState {
  version: string
  language: Lang
  currency: Currency
  year: number
}

/**
 * Auth Module
 */
export interface AuthState {
  username?: string,
  accessKeyId?: string,
  secretAccessKey?: string,
  unauthenticatedPath?: string,
  eventListener: AuthEventListener,
}

export interface AuthEventListener {
  [key: string]: Array<(...params: any[]) => void>
}
