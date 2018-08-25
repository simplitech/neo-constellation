<template>
  <div class="app-container">
    <div class="app-layout app-layout-large">

      <form @submit.prevent="persist" class="panel">
        <div class="panel-header">
          <div class="panel-title col weight-1">
            <span>
              {{$t('view.persistNode.title')}}
            </span>
          </div>
        </div>

        <await name="form">
          <div class="row horiz">
            <div class="col weight-2">
              <div class="form-group">
                <label for="model-idNetwork" class="control-label">
                  {{$t('classes.Network.title')}}
                </label>
                <select id="model-idNetwork" v-model="model.idNetwork">
                  <option :value="null">{{$t('view.persistNode.newNetwork')}}</option>
                  <option v-for="(item, i) in networkList" :key="i" :value="item">
                    {{item}}
                  </option>
                </select>
              </div>
            </div>
          </div>

          <div class="row horiz">
            <div class="col weight-1">
              <input-group type="text" v-model="model.name">
                {{ $t('classes.Node.columns.name') }}
              </input-group>
            </div>

            <div class="col weight-1">
              <div class="form-group">
                <label for="model-size" class="control-label">
                  {{ $t('classes.Node.columns.size') }}
                </label>
                <select id="model-size" v-model="model.size">
                  <option :value="null">{{$t('app.select')}}</option>
                  <option v-for="(item, i) in sizeList" :key="i" :value="item">
                    {{item}}
                  </option>
                </select>
              </div>
            </div>
          </div>

          <div class="row horiz">
            <div class="col weight-1">
              <div class="form-group">
                <label for="model-region" class="control-label">
                  {{ $t('classes.Node.columns.region') }}
                </label>
                <select id="model-region" v-model="model.region">
                  <option :value="null">{{$t('app.select')}}</option>
                  <option v-for="(item, i) in regionList" :key="i" :value="item">
                    {{item}}
                  </option>
                </select>
              </div>
            </div>

            <div class="col weight-1">
              <await name="availabilityZones" spinner="BeatLoader">
                <div class="form-group">
                  <label for="model-zone" class="control-label">
                    {{ $t('classes.Node.columns.availabilityZone') }}
                  </label>
                  <select id="model-zone" v-model="model.availabilityZone">
                    <option :value="null">{{$t('app.optional')}}</option>
                    <option v-for="(item, i) in zoneList" :key="i" :value="item">
                      {{item}}
                    </option>
                  </select>
                </div>
              </await>
            </div>
          </div>
        </await>

        <div class="panel-footer items-end">
          <button type="button" @click="back">{{$t('app.cancel')}}</button>
          <await name="form" spinner="BeatLoader">
            <button type="submit" class="primary">{{$t('app.create')}}</button>
          </await>
        </div>
      </form>

    </div>
  </div>
</template>

<script lang="ts">
import {Component, Watch, Vue} from 'vue-property-decorator'
import {Getter, Action} from 'vuex-class'
import {$, successAndPush, back} from '@/simpli'
import Node from '@/model/Node'
import AwsGlobal from '@/model/AwsGlobal'
import {Size} from '@/enum/Size'
import {Region} from '@/enum/Region'
import {Zone} from '@/enum/Zone'

@Component
export default class DashboardView extends Vue {
  model = new Node()
  networkList: string[] = []
  regionList: Region[] = []
  sizeList: Size[] = []
  zoneList: Zone[] = []
  back = back

  @Watch('model.region')
  async regionEvent(val: Region | null) {
    this.model.availabilityZone = null

    const fetch = async () => {
      this.zoneList = await AwsGlobal.availabilityZones(val || undefined)
    }

    await $.await.run(fetch, 'availabilityZones', 1000)
  }

  async mounted() {
    const fetch = async () => {
      this.networkList = await AwsGlobal.networks()
      this.regionList = await AwsGlobal.regions()
      this.sizeList = await AwsGlobal.sizes()
      await this.regionEvent(this.model.region)
    }

    await $.await.run(fetch, 'form')
  }

  async persist() {
    const fetch = async () => {
      await this.model.validate()
      await this.model.create()
      successAndPush('system.success.persist', '/dashboard')
    }

    await $.await.run(fetch, 'form')
  }
}
</script>
