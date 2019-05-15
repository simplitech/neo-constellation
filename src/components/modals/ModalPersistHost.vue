<template>
  <modal :title="$t('modal.persistHost.title')" name="persistHost" @open="openEvent" @close="closeEvent">

    <div>
      <div class="row horiz">
        <div class="col weight-1">
          <input-text type="text" class="contrast" v-model="host.name">
            {{ $t('classes.Host.columns.name') }}
          </input-text>
        </div>

        <div class="col weight-1">
          <input-select class="contrast"
                        :label="$t('classes.Host.columns.size')"
                        v-model="sizeResource"
                        :items="allSize.items"/>
        </div>
      </div>

      <div class="row horiz">
        <div class="col weight-1">
          <input-select class="contrast"
                        :label="$t('classes.Host.columns.region')"
                        v-model="regionResource"
                        :items="allRegion.items"/>
        </div>

        <div class="col weight-1">
          <await name="availabilityZones" spinner="BeatLoader">
            <input-select class="contrast"
                          :label="$t('classes.Host.columns.availabilityZone')"
                          v-model="zoneResource"
                          :items="allZone.items"/>
          </await>
        </div>
      </div>

      <div class="row horiz">
        <div class="col weight-1">
          <input-textarea class="contrast" :label="$t('classes.Host.columns.initialScript')" v-model="host.initialScript"/>
        </div>
      </div>
    </div>

    <hr>

    <await name="submit" spinnerColor="#59BF00" class="horiz items-center gutter-10">
      <button type="button" @click="close">{{ $t("app.cancel") }}</button>
      <button type="button" class="success" @click="$await.run(submit, 'submit')">{{ $t("app.create") }}</button>
    </await>
  </modal>
</template>

<script lang="ts">
  import {Component, Prop, Vue} from 'vue-property-decorator'
  import {Getter, Action} from 'vuex-class'
  import {$, clone, IResource, ObjectCollection} from '@/simpli'
  import Host from '@/model/Host'
  import {Region} from '@/enum/Region'
  import {Size} from '@/enum/Size'
  import {Zone} from '@/enum/Zone'
  import Network from '@/model/Network'

  @Component
  export default class ModalPersistHost extends Vue {
    @Getter('auth/environment') environment!: Network | null

    host = new Host()

    allRegion = new ObjectCollection(Region).prependNull('')
    allSize = new ObjectCollection(Size).prependNull('')
    allZone = new ObjectCollection(Zone).prependNull('')

    get regionResource() {
      return this.allRegion.get(this.host.region)
    }
    set regionResource(val: IResource | null) {
      this.host.region = val && val.$id as Region || null
    }

    get sizeResource() {
      return this.allSize.get(this.host.size)
    }
    set sizeResource(val: IResource | null) {
      this.host.size = val && val.$id as Size || null
    }

    get zoneResource() {
      return this.allZone.get(this.host.availabilityZone)
    }
    set zoneResource(val: IResource | null) {
      this.host.availabilityZone = val && val.$id as Zone || null
    }

    closeEvent() {
      this.host = new Host()
      this.$emit('close')
    }

    openEvent() {
      this.host = new Host()
      this.$emit('open')
    }

    close() {
      $.modal.close('persistHost')
    }

    async submit() {
      this.host.networkId = this.environment && this.environment.$id || null
      await this.host.validate()
      await this.host.create()
      this.close()
    }
  }
</script>
