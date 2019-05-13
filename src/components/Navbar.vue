<template>
  <header>
    <nav>
      <div class="brand">
        <a href="https://neo.org/" class="btn" target="_blank">
          <img src="../assets/img/neo@3x.png" alt="NEO Constallation">
        </a>
      </div>

      <div class="slot-1">
        <transition name="fade" mode="out-in">
          <ul v-if="hasEnvironment">
            <li>
              <button class="flat contrast">
                {{$t('nav.hosts')}}
              </button>
            </li>

            <li>
              <button class="flat contrast">
                {{$t('nav.logsDashboard')}}
              </button>
            </li>

            <li>
              <button class="flat contrast">
                {{$t('nav.securityGroups')}}
              </button>
            </li>

            <li>
              <button class="flat contrast">
                {{$t('nav.configurationFiles')}}
              </button>
            </li>

            <li>
              <button class="flat danger">
                {{$t('nav.deleteNetwork')}}
              </button>
            </li>
          </ul>
        </transition>
      </div>

      <div class="slot-2">
        <div class="verti gutter-5">
          <div v-if="isLogged" class="label primary">
            <div class="label-prefix">
              <i class="fab fa-aws"></i>
            </div>
            <span>
              {{user.username | truncate(22) }}
            </span>
            <div class="label-postfix">
              <div class="label-button w-80" @click="signOut()">
              <span>
                <i class="fas fa-times"></i>
                {{$t('app.logout')}}
              </span>
              </div>
            </div>
          </div>

          <div v-if="hasEnvironment" class="label success">
            <div class="label-prefix">
              <i class="fas fa-network-wired"></i>
            </div>
            <div>
              {{ environment.name }}
              <br>
              <small>
                {{ $t('classes.Network.columns.runningSince') }}
                {{ environment.runningSince | moment($t('dateFormat.datetime')) }}
              </small>
            </div>
            <div class="label-postfix">
              <div class="label-button w-80" @click="exitEnvironment()">
                <span>
                  <i class="fas fa-times"></i>
                  {{$t('app.exit')}}
                </span>
              </div>
            </div>
          </div>
        </div>
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
  import Network from '@/model/Network'

  @Component
  export default class Navbar extends Vue {
    @Getter('auth/isLogged') isLogged?: boolean
    @Getter('auth/user') user?: User
    @Getter('auth/hasEnvironment') hasEnvironment?: boolean
    @Getter('auth/environment') environment?: Network

    @Action('auth/signOut') signOut?: Function
    @Action('auth/exitEnvironment') exitEnvironment!: Function
  }
</script>
