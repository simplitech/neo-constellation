/**
 * @file
 * Router Configuration
 * Used in library: vue-router
 *
 * Use this file to register the App routes
 * See https://router.vuejs.org/guide/#javascript
 * This configuration will be set in @/bootstrap/app.ts
 */
import {RouterOptions} from 'vue-router'

import DefaultPanelLayout from '@/views/layouts/DefaultPanelLayout.vue'
import SignInView from '@/views/SignInView.vue'
import DashboardView from '@/views/DashboardView.vue'
import GetAppBlueprintView from '@/views/get/GetAppBlueprintView.vue'

import NetworkLayout from '@/views/layouts/NetworkLayout.vue'
import HostView from '@/views/networks/HostsView.vue'
import LogsDashboardView from '@/views/networks/LogsDashboardView.vue'
import SecurityGroupsView from '@/views/networks/SecurityGroupsView.vue'
import ConfigurationFilesView from '@/views/networks/ConfigurationFilesView.vue'

/**
 * VUE Router Configuration
 */
export const router: RouterOptions = {
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
        {
          path: '/network',
          redirect: '/network/hosts',
          component: NetworkLayout,
          children: [
            {
              path: '/network/hosts',
              name: 'host',
              component: HostView,
            },
            {
              path: '/network/logs-dashboard',
              name: 'logsDashboard',
              component: LogsDashboardView,
            },
            {
              path: '/network/security-groups',
              name: 'securityGroups',
              component: SecurityGroupsView,
            },
            {
              path: '/network/configuration-files',
              name: 'configurationFiles',
              component: ConfigurationFilesView,
            },
          ],
        },
        {
          path: '/app-blueprint/:id',
          name: 'getAppBlueprint',
          component: GetAppBlueprintView,
          props: true,
        },
      ],
    },
    {path: '/', redirect: '/sign-in'},
    {path: '*', redirect: '/dashboard'},
  ],
}
