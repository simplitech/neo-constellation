import {SnotifyPosition} from 'vue-snotify'
<template>
  <div id="app">
    <transition name="blur" mode="out-in">
      <router-view/>
    </transition>

    <vue-snotify :class="ToastStyle.DARK"/>
  </div>
</template>

<style lang="scss">
  @import "scss/app";
</style>

<script lang="ts">
  import {Component, Vue} from 'vue-property-decorator'
  import {$, ToastStyle} from '@/simpli'

  const metaInfo = () => ({
    title: $.t('app.subtitle'),
    titleTemplate: `%s | ${$.t('app.title')}`,
  })

  @Component({metaInfo})
  export default class App extends Vue {
    ToastStyle = ToastStyle
  }
</script>
