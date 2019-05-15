<template>
  <modal :title="$t('modal.removeNetwork.title')"
         name="removeNetwork"
         @open="openEvent"
         @close="closeEvent"
  >
    <h4>
      {{ $t('modal.removeNetwork.body') }}
    </h4>

    <h4 v-if="network" class="my-10 text-center text-danger">
      {{network.$tag}}
    </h4>

    <hr>

    <await name="submit" spinnerColor="#59BF00" class="horiz items-center gutter-10">
      <button type="button" @click="cancel">{{ $t("app.cancel") }}</button>
      <button type="button" @click="confirm" class="danger">{{ $t("app.confirm") }}</button>
    </await>
  </modal>
</template>

<script lang="ts">
  import {Component, Prop, Vue} from 'vue-property-decorator'
  import {$} from '../../simpli'
  import Network from '@/model/Network'

  @Component
  export default class ModalRemoveNetwork extends Vue {
    network: Network | null = null

    closeEvent() {
      this.network = null

      this.$emit('close')
    }

    openEvent(network: Network) {
      this.network = network

      this.$emit('open')
    }

    confirm() {
      this.$emit('confirm', this.network)
      this.close()
    }

    cancel() {
      this.$emit('cancel')
      this.close()
    }

    close() {
      this.$modal.close('removeNetwork')
    }

  }
</script>
