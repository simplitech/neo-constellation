<template>
  <modal :title="$t('modal.terminateHost.title')"
         name="terminateHost"
         @open="openEvent"
         @close="closeEvent"
  >
    <h4>
      {{ $t('modal.terminateHost.body') }}
    </h4>

    <h4 v-if="host" class="my-10 text-center text-danger">
      {{host.instanceId}}
      ({{host.name}})
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
  import Host from '@/model/Host'

  @Component
  export default class ModalTerminateHost extends Vue {
    host: Host | null = null

    closeEvent() {
      this.host = null

      this.$emit('close')
    }

    openEvent(host: Host) {
      this.host = host

      this.$emit('open')
    }

    confirm() {
      this.$emit('confirm', this.host)
      this.close()
    }

    cancel() {
      this.$emit('cancel')
      this.close()
    }

    close() {
      this.$modal.close('terminateHost')
    }

  }
</script>
