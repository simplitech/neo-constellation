<template>
  <modal :title="$t('modal.removeApplicationBlueprint.title')"
         name="removeApplicationBlueprint"
         @open="openEvent"
         @close="closeEvent"
  >
    <div>
      {{ $t('modal.removeApplicationBlueprint.body') }}
    </div>

    <hr>

    <await name="submit" class="horiz items-center gutter-10">
      <button type="button" @click="cancel">{{ $t("app.cancel") }}</button>
      <button type="button" @click="confirm" class="success">{{ $t("app.confirm") }}</button>
    </await>
  </modal>
</template>

<script lang="ts">
  import {Component, Prop, Vue} from 'vue-property-decorator'
  import {$} from '../../simpli'

  @Component
  export default class ModalRemoveApplicationBlueprint extends Vue {
    payload: any = null

    closeEvent() {
      this.payload = null

      this.$emit('close')
    }

    openEvent(payload: any) {
      this.payload = payload

      this.$emit('open')
    }

    confirm() {
      this.$emit('confirm', this.payload)
      this.close()
    }

    cancel() {
      this.$emit('cancel')
      this.close()
    }

    close() {
      this.$modal.close('removeApplicationBlueprint')
    }

  }
</script>