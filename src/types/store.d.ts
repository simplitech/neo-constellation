import {ID, Currency, Lang} from '@/simpli'
import User from '@/model/User'

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
  accessKeyId?: string,
  secretAccessKey?: string,
  unauthenticatedPath?: string,
  eventListener: AuthEventListener,
}

export interface AuthEventListener {
  [key: string]: Array<(...params: any[]) => void>
}
