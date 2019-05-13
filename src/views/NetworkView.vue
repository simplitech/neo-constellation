<template>
  <section class="container">
  </section>
</template>

<script lang="ts">
import {Component, Vue} from 'vue-property-decorator'
import {Getter, Action} from 'vuex-class'
import {$} from '@/simpli'

@Component
export default class NetworkView extends Vue {
  @Getter('auth/hasEnvironment') hasEnvironment!: boolean

  async created() {
    if (!this.hasEnvironment) {
      $.router.replace('/dashboard')
    }
  }
}
</script>
