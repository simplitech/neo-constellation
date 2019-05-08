import {SnotifyPosition} from 'vue-snotify'
<template>
  <div id="app">
    <transition name="blur" mode="out-in">
      <router-view/>
    </transition>

    <vue-snotify :class="toastStyle"/>
  </div>
</template>

<style lang="scss">
  @import "scss/app";
</style>

<script lang="ts">
  import {Component, Vue} from 'vue-property-decorator'
  import {Action} from 'vuex-class'
  import {$, ToastDefaultConfig, ToastGlobalConfig, ToastStyle} from '@/simpli'

  const metaInfo = () => ({
    title: $.t('app.subtitle'),
    titleTemplate: `%s | ${$.t('app.title')}`,
  })

  @Component({metaInfo})
  export default class App extends Vue {
    @Action('auth/onSignIn') onSignIn!: Function
    @Action('auth/onAuth') onAuth!: Function
    @Action('auth/onSignOut') onSignOut!: Function
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
      const toastDefaultConfig = ToastDefaultConfig
      toastDefaultConfig.position = 'leftTop' as any

      this.onSignIn(this.signInEvent)
      this.onAuth(this.authEvent)
      this.onSignOut(this.signOutEvent)

      this.$snotify.setDefaults({
        global: ToastGlobalConfig,
        toast: toastDefaultConfig,
      })
    }
  }
</script>
