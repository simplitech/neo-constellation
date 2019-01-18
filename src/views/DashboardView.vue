<template>
  <section class="container">
    <await name="listNetwork" effect="fade-up">
      <div class="row horiz items-center">
        <div class="col weight-1">
          <h2>
            <i class="fas fa-network-wired"></i>
            {{$t('classes.Network.title')}}
          </h2>
        </div>
        <div class="col">
          <button class="primary" @click="addHostFromStack">
            {{$t('view.dashboard.addHostFromStack')}}
          </button>
        </div>
        <div class="col">
          <button class="primary" @click="addEmptyHost">
            {{$t('view.dashboard.addEmptyHost')}}
          </button>
        </div>
        <div class="col">
          <button class="primary" @click="test">
            Teste
          </button>
        </div>
      </div>

      <div class="panel des-ml-50 tab-ml-30 mb-10" v-for="(network, i) in networks" :key="network.$id">
        <div class="panel-header no-body hoverable">
          <div class="mr-15">
            <div class="panel-title">
              <i class="fas fa-network-wired"></i>
            </div>
          </div>

          <div class="label primary force-mr-5">
            <div class="label-prefix">
              {{$t('classes.Network.columns.$id')}}
            </div>
            <span>{{network.$id}}</span>
          </div>

          <div class="label primary force-mr-5 force-desktop-tablet">
            <div class="label-prefix">
              {{$t('classes.Network.columns.name')}}
            </div>
            <span>{{network.name}}</span>
          </div>
        </div>
      </div>

      <div class="row horiz items-center">
        <div class="col weight-1">
          <h2>
            <i class="fas fa-drafting-compass"></i>
            {{$t('classes.ApplicationBlueprint.title')}}
          </h2>
        </div>
        <div class="col">
          <button class="primary" @click="newApplication">
            {{$t('view.dashboard.newApplication')}}
          </button>
        </div>
      </div>

      <div class="panel des-ml-50 tab-ml-30 mb-10" v-for="(appBlueprint, i) in appBlueprints" :key="appBlueprint.$id">
        <div class="panel-header no-body hoverable">
          <div class="mr-15">
            <div class="panel-title">
              <i class="fas fa-drafting-compass"></i>
            </div>
          </div>

          <div class="label primary force-mr-5">
            <div class="label-prefix">
              {{$t('classes.ApplicationBlueprint.columns.name')}}
            </div>
            <span>{{appBlueprint.name}}</span>
          </div>

          <div class="label primary force-mr-5 force-desktop-tablet">
            <div class="label-prefix">
              {{$t('classes.ApplicationBlueprint.columns.role')}}
            </div>
            <span>{{appBlueprint.role}}</span>
          </div>

          <div class="label primary force-mr-5 force-desktop-tablet" v-if="appBlueprint.dockerImageId">
            <div class="label-prefix">
              {{$t('classes.ApplicationBlueprint.columns.dockerImageId')}}
            </div>
            <span>{{appBlueprint.dockerImageId}}</span>
          </div>

          <div class="label primary force-mr-5 force-desktop-tablet" v-if="appBlueprint.repositoryUrl">
            <div class="label-prefix">
              {{$t('classes.ApplicationBlueprint.columns.repositoryUrl')}}
            </div>
            <span>{{appBlueprint.repositoryUrl}}</span>
          </div>
        </div>
      </div>

    </await>
  </section>
</template>

<script lang="ts">
import {Component, Vue} from 'vue-property-decorator'
import {Getter, Action} from 'vuex-class'
import Network from '@/model/Network'
import User from '@/model/User'
import ApplicationBlueprint from '@/model/ApplicationBlueprint'
import {$, sleep} from '@/simpli'
import SecurityGroup from '@/model/SecurityGroup'
import Rule from '@/model/Rule'
import Host from '@/model/Host'
import {Region} from '@/enum/Region'
import {Size} from '@/enum/Size'
import {Zone} from '@/enum/Zone'

@Component
export default class DashboardView extends Vue {
  @Getter('auth/user') user!: User
  @Getter('auth/networks') networks!: Network[]
  @Getter('auth/appBlueprints') appBlueprints!: ApplicationBlueprint[]

  @Action('auth/syncNetworks') syncNetworks!: Function
  @Action('auth/syncAppBlueprints') syncAppBlueprints!: Function

  async mounted() {
    await this.populate()
  }

  async populate() {
    await this.syncNetworks()
    await this.syncAppBlueprints()
  }

  async addEmptyHost() {
    $.modal.open('persistNetwork')
  }

  async addHostFromStack() {
    /**/
  }

  async newApplication() {
    $.modal.open('persistApplicationBlueprint')
  }

  async test() {
    const net = new Network()
    await net.get('4wy8kD6xF')

    console.log(net)

    net.delete()
  }
}
</script>
