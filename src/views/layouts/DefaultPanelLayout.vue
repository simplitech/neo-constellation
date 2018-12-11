<template>
  <main>
    <navbar/>
    <transition name="fade-down" mode="out-in">
      <router-view class="weight-1"/>
    </transition>
  </main>
</template>

<script lang="ts">
  import {Component, Prop, Vue} from 'vue-property-decorator'
  import {Getter, Action} from 'vuex-class'
  import Navbar from '@/components/Navbar.vue'

  @Component({
    components: {Navbar},
  })
  export default class DefaultPanelLayout extends Vue {
    @Action('auth/auth') auth?: Function

    async created() {
      await this.auth!()
    }
  }
</script>
