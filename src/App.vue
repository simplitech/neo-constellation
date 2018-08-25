<template>
  <div id="app">
    <transition name="fade-y-down" mode="out-in">
      <router-view/>
    </transition>

    <vue-snotify :class="toastStyle"/>
  </div>
</template>

<style lang="scss">
  $img-path: "./assets/img/";
  $font-path: "./assets/font/";
  @import "./scss/app";
</style>

<script lang="ts">
  import { Component, Vue, Watch } from 'vue-property-decorator'
  import {Action, Getter} from 'vuex-class'
  import {ToastDefaultConfig, ToastGlobalConfig, ToastStyle} from '@/simpli'

  @Component
  export default class App extends Vue {
    @Action('auth/onSignIn') onSignIn?: Function
    @Action('auth/onAuth') onAuth?: Function
    @Action('auth/onSignOut') onSignOut?: Function
    toastStyle: ToastStyle = ToastStyle.DARK

    // When the user or system signs in
    signInEvent() {
      //
    }

    // When an auth view is accessed successfully
    authEvent() {
      //
    }

    // When the user or system signs out
    signOutEvent() {
      //
    }

    created() {
      this.onSignIn!(this.signInEvent)
      this.onAuth!(this.authEvent)
      this.onSignOut!(this.signOutEvent)

      this.$snotify.setDefaults({
        global: ToastGlobalConfig,
        toast: ToastDefaultConfig,
      })
    }
  }
</script>
