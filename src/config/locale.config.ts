import {Lang, Currency} from '@/simpli'

import enUs from '@/locale/en-US/lang'

/*
 *** IMPORT HERE THE MOMENT LANGUAGES PACKS ***
 * Note: US English is already imported by default
 */
import 'moment/locale/pt-br'

/*
 *** SET HERE THE DEFAULT LANGUAGE ***
 */
export const defaultLang = (localStorage.getItem('lang') || process.env.VUE_APP_LANG) as Lang

/*
 *** SET HERE THE DEFAULT CURRENCY ***
 */
export const defaultCurrency = process.env.VUE_APP_CURRENCY as Currency

/*
 *** REGISTER HERE THE LOCALES ***
 */
export const locale = {
  [Lang.EN_US]: enUs,
}
