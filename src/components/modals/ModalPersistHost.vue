<template>
  <modal :title="$t('modal.persistHost.title')" name="persistHost" @open="openEvent" @close="closeEvent" :closable="false">

    <div>
      <div class="row horiz">
        <div class="col weight-1">
          <input-text type="text" class="required contrast" v-model="host.name">
            {{ $t('classes.Host.columns.name') }}
          </input-text>
        </div>

        <div class="col weight-1">
          <input-select class="required contrast"
                        :label="$t('classes.Host.columns.region')"
                        v-model="regionResource"
                        :items="allRegion.items"/>
        </div>
      </div>

      <div class="row horiz">
        <div class="col weight-1">
          <input-select class="required contrast"
                        :label="$t('classes.Host.columns.size')"
                        v-model="sizeResource"
                        :items="allSize.items"/>
        </div>

        <div class="col weight-1">
          <await name="availabilityZones" spinner="BeatLoader" spinnerColor="#59BF00">
            <input-select class="contrast"
                          :label="$t('classes.Host.columns.availabilityZone')"
                          v-model="host.availabilityZone"
                          :items="allZone.items"/>
          </await>
        </div>
      </div>

      <div class="row horiz">
        <div class="col weight-1">
          <input-select class="required contrast"
                        :label="$t('classes.Host.columns.securityGroup')"
                        v-model="host.securityGroup"
                        :items="allSG"/>
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
  import {Component, Watch, Vue} from 'vue-property-decorator'
  import {Getter, Action} from 'vuex-class'
  import {$, clone, IResource, ObjectCollection} from '@/simpli'
  import Host from '@/model/Host'
  import {Region} from '@/enum/Region'
  import {Size} from '@/enum/Size'
  import {Zone} from '@/enum/Zone'
  import Network from '@/model/Network'
  import SecurityGroup from '@/model/SecurityGroup'
  import AwsGlobal from '@/model/AwsGlobal'

  @Component
  export default class ModalPersistHost extends Vue {
    @Getter('auth/environment') environment!: Network | null

    host = new Host() as Host

    allRegion = new ObjectCollection(Region).prependNull('')
    allSize = new ObjectCollection(Size).prependNull('')
    allZone: Zone[] = []

    get allSG() {
      if (this.environment) {
        return this.environment.securityGroups
      }
      return []
    }

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

    @Watch('host.region')
    async regionEvent(val: Region | null) {
      this.host.availabilityZone = null

      const fetch = async () => {
        this.allZone = await AwsGlobal.availabilityZones(val || undefined)
      }

      await $.await.run(fetch, 'availabilityZones', 1000)
    }

    closeEvent() {
      this.host = new Host() as Host
      this.$emit('close')
    }

    openEvent() {
      this.host = new Host() as Host
      this.$emit('open')
    }

    close() {
      $.modal.close('persistHost')
    }

    async submit() {
      this.host.networkId = this.environment && this.environment.$id || null
      const fetch = async () => {
        await this.host.validate()
        await this.environment.addHost(this.host)
      }
      await $.await.run(fetch, 'submit')
      this.close()
    }
  }
</script>
