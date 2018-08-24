<template>
  <div class="app-container">
    <div class="app-layout app-layout-large">

      <form @submit.prevent="persist" class="panel">
        <div class="panel-header">
          <div class="panel-title col weight-1">
            <span>
              Create Node
            </span>
          </div>
        </div>

        <await name="persist">
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
          <button type="submit" class="primary">Create</button>
        </div>
      </form>

    </div>
  </div>
</template>

<script lang="ts">
import {Component, Watch, Vue} from 'vue-property-decorator'
import {Action} from 'vuex-class'
import {$} from '@/simpli'
import Node from '@/model/Node'
import {Size} from '@/enum/Size'
import AwsGlobal from '@/model/AwsGlobal'
import {Region} from '@/enum/Region'

@Component
export default class DashboardView extends Vue {
  model = new Node()
  sizeList = Size
  regionList: string[] = []
  zoneList: string[] = []

  @Watch('model.region')
  async regionEvent(val: Region | null) {
    this.model.availabilityZone = null

    const fetch = async () => {
      this.zoneList = await AwsGlobal.availabilityZones(val || undefined)
    }

    await $.await.run(fetch, 'availabilityZones', 1000)
  }

  async created() {
    this.regionList = await AwsGlobal.regions()
    await this.regionEvent(this.model.region)
  }

  async persist() {
    await this.model.validate()
  }
}
</script>
