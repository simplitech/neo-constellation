<template>
  <div>
    <div class="text-center p-10">
      <input type="submit" @click="signOut()" value="Logout"/>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import {Action} from 'vuex-class'
import Node from '@/model/Node'

@Component
export default class DashboardView extends Vue {
  @Action('auth/signOut') signOut?: Function

  node = new Node()

  async mounted() {
    //
  }
}
</script>
