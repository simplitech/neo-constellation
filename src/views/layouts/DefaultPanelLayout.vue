<template>
  <main class="horiz nowrap">
    <transition name="fade-y" mode="out-in">
      <router-view class="weight-1"/>
    </transition>
  </main>
</template>

<script lang="ts">
import {Component, Prop, Vue} from 'vue-property-decorator'
import {Action} from 'vuex-class'

@Component
export default class DefaultPanelLayout extends Vue {
  @Action('auth/auth') auth?: Function

  created() {
    this.auth!()
  }
}
</script>
