<template>
  <await name="authentication" spinner="FadeLoader">
    <main>
      <navbar/>
      <transition name="fade-down" mode="out-in">
        <router-view v-if="authorized" class="weight-1"/>
      </transition>

      <modal-persist-network/>
    </main>
  </await>
</template>

<script lang="ts">
  import {Component, Prop, Vue} from 'vue-property-decorator'
  import {Action} from 'vuex-class'
  import {sleep} from '@/simpli'
  import Navbar from '@/components/Navbar.vue'
  import ModalPersistNetwork from '@/components/modals/ModalPersistNetwork.vue'
  import ModalPersistApplicationBlueprint from '@/components/modals/ModalPersistApplicationBlueprint.vue'

  @Component({
    components: {ModalPersistApplicationBlueprint, Navbar, ModalPersistNetwork},
  })
  export default class DefaultPanelLayout extends Vue {
    @Action('auth/auth') auth!: Function
    @Action('auth/syncNetworks') syncNetworks!: Function
    @Action('auth/syncAppBlueprints') syncAppBlueprints!: Function

    authorized = false

    async mounted() {
      await this.auth()
      this.authorized = true
      await this.populate()
    }

    async populate() {
      await sleep(500)
      this.syncNetworks()
      this.syncAppBlueprints()
    }
  }
</script>
