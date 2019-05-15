<template>
  <header>
    <nav>
      <div class="brand">
        <transition name="fade" mode="out-in">
          <div v-if="!sidebar">
            <a href="https://neo.org/" class="btn" target="_blank">
              <img src="../assets/img/neo@3x.png" alt="NEO Constallation">
            </a>
          </div>
        </transition>
      </div>

      <div class="slot-1">
        <transition name="fade" mode="out-in">
          <ul v-if="!hasEnvironment">
            <li>
              <router-link tag="button" to="/dashboard" class="flat contrast">
                {{$t('nav.dashboard')}}
              </router-link>
            </li>
          </ul>

          <ul v-else>
            <li>
              <router-link tag="button" to="/network/hosts" class="flat contrast">
                {{$t('nav.hosts')}}
              </router-link>
            </li>

            <li>
              <router-link tag="button" to="/network/logs-dashboard" class="flat contrast">
                {{$t('nav.logsDashboard')}}
              </router-link>
            </li>

            <li>
              <router-link tag="button" to="/network/security-groups" class="flat contrast">
                {{$t('nav.securityGroups')}}
              </router-link>
            </li>

            <li>
              <router-link tag="button" to="/network/configuration-files" class="flat contrast">
                {{$t('nav.configurationFiles')}}
              </router-link>
            </li>

            <li>
              <button class="flat danger" @click="confirmDeleteNetwork">
                {{$t('nav.deleteNetwork')}}
              </button>
            </li>
          </ul>
        </transition>
      </div>

      <transition name="fade" mode="out-in">
        <div class="slot-2" v-if="!sidebar">
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

            <div v-if="hasEnvironment" class="label" :class="environment.isRunning ? 'success' : 'danger'">
              <div class="label-prefix">
                <i class="fas fa-network-wired"></i>
              </div>
              <div class="text-center">
                {{ environment.name }}

                <br>

                <template v-if="environment.isRunning">
                  <small>
                    {{ $t('classes.Network.columns.runningSince') }}
                    {{ environment.runningSince | moment($t('dateFormat.datetime')) }}
                  </small>
                </template>

                <template v-else>
                  <button @click="buildNetwork" class="small fluid">
                    {{ $t('classes.Network.columns.build') }}
                  </button>
                </template>
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
      </transition>

      <div class="menu-icon">
        <button class="icon" @click="sidebar=true">
          <img src="../assets/img/menu.svg" alt="menu">
        </button>
      </div>
    </nav>

    <aside>
      <transition name="fade" mode="out-in">
        <div class="outbound" @click="sidebar=false" v-if="sidebar"></div>
      </transition>

      <transition name="fade-left-big" mode="out-in">
        <nav class="sidebar" v-if="sidebar">
          <div class="brand">
            <a href="https://neo.org/" class="btn" target="_blank">
              <img src="../assets/img/neo@3x.png" alt="NEO Constallation">
            </a>
          </div>

          <div class="menu">
            <ul>
              <li>
                <router-link tag="button" to="/network/hosts" class="flat contrast">
                  {{$t('nav.hosts')}}
                </router-link>
              </li>
              <li>
                <router-link tag="button" to="/network/logs-dashboard" class="flat contrast">
                  {{$t('nav.logsDashboard')}}
                </router-link>
              </li>
              <li>
                <router-link tag="button" to="/network/security-groups" class="flat contrast">
                  {{$t('nav.securityGroups')}}
                </router-link>
              </li>
              <li>
                <router-link tag="button" to="/network/configuration-files" class="flat contrast">
                  {{$t('nav.configurationFiles')}}
                </router-link>
              </li>
              <li>
                <button class="flat danger" @click="confirmDeleteNetwork">
                  {{$t('nav.deleteNetwork')}}
                </button>
              </li>
            </ul>
          </div>

          <div>
            <div class="verti gutter-5">
              <div v-if="isLogged" class="label primary">
                <div class="label-prefix">
                  <i class="fab fa-aws"></i>
                </div>
                <span>
                  {{user.username | truncate(12) }}
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

              <div v-if="hasEnvironment" class="label" :class="environment.isRunning ? 'success' : 'danger'">
                <div class="label-prefix">
                  <i class="fas fa-network-wired"></i>
                </div>
                <div class="text-center">
                  {{ environment.name }}

                  <br>

                  <template v-if="environment.isRunning">
                    <small>
                      {{ $t('classes.Network.columns.runningSince') }}
                      {{ environment.runningSince | moment($t('dateFormat.datetime')) }}
                    </small>
                  </template>

                  <template v-else>
                    <button @click="buildNetwork" class="small fluid">
                      {{ $t('classes.Network.columns.build') }}
                    </button>
                  </template>
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
        </nav>
      </transition>
    </aside>

    <modal-remove-network @confirm="deleteNetwork"/>
  </header>
</template>

<script lang="ts">
  import {Component, Prop, Vue} from 'vue-property-decorator'
  import {Getter, Action} from 'vuex-class'
  import User from '@/model/User'
  import Network from '@/model/Network'
  import ModalRemoveNetwork from '@/components/modals/ModalRemoveNetwork.vue'

  @Component({
    components: {ModalRemoveNetwork},
  })
  export default class Navbar extends Vue {
    @Getter('auth/isLogged') isLogged!: boolean
    @Getter('auth/user') user!: User
    @Getter('auth/hasEnvironment') hasEnvironment!: boolean
    @Getter('auth/environment') environment!: Network | null

    @Action('auth/signOut') signOut?: Function
    @Action('auth/refreshEnvironment') refreshEnvironment!: Function
    @Action('auth/exitEnvironment') exitEnvironment!: Function

    sidebar: boolean = false

    async buildNetwork() {
      if (this.environment) {
        await this.environment.build()
        this.refreshEnvironment()
      }
    }

    async deleteNetwork(environment: Network) {
      await environment.delete()
      this.exitEnvironment()
    }

    confirmDeleteNetwork() {
      if (this.environment) {
        this.$modal.open('removeNetwork', this.environment)
      }
    }
  }
</script>
