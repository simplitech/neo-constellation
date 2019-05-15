<template>
  <div v-if="hasEnvironment">
    <transition name="fade-down" mode="out-in">
      <router-view/>
    </transition>
  </div>
</template>

<script lang="ts">
  import {Component, Vue} from 'vue-property-decorator'
  import {Getter} from 'vuex-class'
  import {$} from '@/simpli'

  @Component
  export default class NetworkLayout extends Vue {
    @Getter('auth/hasEnvironment') hasEnvironment!: boolean

    async created() {
      if (!this.hasEnvironment) {
        $.router.replace('/dashboard')
      }
    }
  }
</script>
