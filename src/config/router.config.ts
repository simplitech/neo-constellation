/**
 * @file
 * Router Configuration
 * Used in library: vue-router
 *
 * Use this file to register the App routes
 * See https://router.vuejs.org/guide/#javascript
 * This configuration will be set in @/bootstrap/app.ts
 */

import DefaultPanelLayout from '@/views/layouts/DefaultPanelLayout.vue'
import SignInView from '@/views/SignInView.vue'
import DashboardView from '@/views/DashboardView.vue'
import PersistNodeView from '@/views/PersistNodeView.vue'
import LogDashboard from '@/views/LogDashboard.vue'

/**
 * VUE Router Configuration
 */
export const router = {
  routes: [
    {
      path: '/sign-in',
      name: 'signIn',
      component: SignInView,
    },
    {
      path: '/dashboard',
      component: DefaultPanelLayout,
      children: [
        {
          path: '/dashboard',
          name: 'dashboard',
          component: DashboardView,
        },
        {path: '/node/new', component: PersistNodeView},
        {path: '/log', component: LogDashboard},
      ],
    },
    {path: '/', redirect: '/sign-in'},
    {path: '*', redirect: '/dashboard'},
  ],
}
