import {$, error} from '@/simpli'

/*
 *** SET HERE THE API ENDPOINT ***
 */
export const apiURL = process.env.VUE_APP_API_URL

/*
 *** REGISTER HERE THE API INTERCEPTOR ***
 */
export const httpInterceptor = (request: any, next: any) => {
  next((resp: any) => {
    if (!resp.status) error('system.error.noServer')
    else if (resp.status >= 400) {
      $.snotify.error(resp.data.message || resp.statusText, resp.status.toString())
    }
  })
}
