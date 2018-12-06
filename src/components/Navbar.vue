<template>
  <header>
    <nav>
      <div class="brand">
        <a href="https://neo.org/" class="btn" target="_blank">
          <img src="../assets/img/neo@3x.png" alt="NEO Constallation">
        </a>
      </div>

      <div class="slot-1">
      </div>

      <div class="slot-2">
          <span class="text-white">
            {{user.username}}
          </span>
      </div>

      <div class="slot-3">
        <ul>
          <li v-if="isLogged">
            <button @click="signOut()" class="contrast">
              {{$t('app.logout')}}
            </button>
          </li>
        </ul>
      </div>

      <div class="menu-icon">
      </div>
    </nav>
  </header>

</template>

<script lang="ts">
import {Component, Prop, Vue} from 'vue-property-decorator'
import {Getter, Action} from 'vuex-class'
import User from '@/model/User'

@Component
export default class Navbar extends Vue {
  @Getter('auth/isLogged') isLogged?: boolean
  @Getter('auth/user') user?: User

  @Action('auth/signOut') signOut?: Function
}
</script>