<template>
  <div id="app">
    <transition name="fade-y" mode="out-in">
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
  import {ToastDefaultConfig, ToastDefaultStyle, ToastGlobalConfig, ToastStyle} from '@/simpli'

  @Component
  export default class App extends Vue {
    toastStyle: ToastStyle = ToastDefaultStyle

    created() {
      this.$snotify.setDefaults({
        global: ToastGlobalConfig,
        toast: ToastDefaultConfig,
      })
    }
  }
</script>
