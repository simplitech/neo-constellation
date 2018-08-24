import DefaultPanelLayout from '@/views/layouts/DefaultPanelLayout.vue'
import LoginView from '@/views/LoginView.vue'
import DashboardView from '@/views/DashboardView.vue'
import PersistNodeView from '@/views/PersistNodeView.vue'

/*
 *** SET HERE THE ROUTER OPTIONS ***
 */
export const router = {
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginView,
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
      ],
    },
    {path: '/', redirect: '/login'},
    {path: '*', redirect: '/dashboard'},
  ],
}
