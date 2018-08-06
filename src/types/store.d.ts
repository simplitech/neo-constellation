import {Currency, Lang} from '@/simpli'
/**
 * Root
 */
export interface RootState {
  version: string
  language: Lang
  currency: Currency
  year: number
}
