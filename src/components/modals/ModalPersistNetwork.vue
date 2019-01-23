<template>
  <modal :title="$t('modal.persistNetwork.title')" name="persistNetwork" @open="openEvent" @close="closeEvent">
    <div class="horiz">
      <input-text autofocus class="weight-1 contrast required"
                  :label="$t('classes.Network.columns.name')"
                  v-model="network.name"/>
    </div>

    <hr>

    <await name="submit" class="horiz items-center gutter-10">
      <button type="button" @click="close">{{ $t("app.cancel") }}</button>
      <button type="button" class="success" @click="$await.run(submit, 'submit')">{{ $t("app.create") }}</button>
    </await>
  </modal>
</template>

<script lang="ts">
  import {Component, Prop, Vue} from 'vue-property-decorator'
  import {Getter, Action} from 'vuex-class'
  import {$, sleep, abort} from '../../simpli'
  import Network from '../../model/Network'

  @Component
  export default class ModalPersistNetwork extends Vue {
    @Action('auth/syncNetworks') syncNetworks!: Function

    network = new Network()

    closeEvent() {
      this.network = new Network()
      this.$emit('close')
    }

    openEvent() {
      this.network = new Network()
      this.$emit('open')
    }

    close() {
      $.modal.close('persistNetwork')
    }

    async submit() {
      await this.network.validate()
      await this.network.persist()
      this.close()
      this.syncNetworks()
    }
  }
</script>