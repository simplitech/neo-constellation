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
          <div class="panel-title">
            <i class="fas fa-network-wired"></i>
          </div>

          <div class="weight-1 horiz gutter-10 mx-10">
            <div class="label primary force-my-1">
              <div class="label-prefix">
                {{$t('classes.Network.columns.$id')}}
              </div>
              <span>{{network.$id}}</span>
            </div>

            <div class="label primary force-my-1">
              <div class="label-prefix">
                {{$t('classes.Network.columns.name')}}
              </div>
              <span>{{network.name}}</span>
            </div>
          </div>

          <div>
            <i class="fas fa-2x fa-angle-right"></i>
          </div>
        </div>
      </div>
    </await>

    <await name="listApplicationBlueprint" effect="fade-up">
      <div class="row horiz items-center">
        <div class="col weight-1">
          <h2>
            <i class="fas fa-drafting-compass"></i>
            {{$t('classes.ApplicationBlueprint.title')}}
          </h2>
        </div>
        <div class="col">
          <button class="primary" @click="newApplicationBlueprint">
            {{$t('view.dashboard.newApplication')}}
          </button>
        </div>
      </div>

      <div class="panel des-ml-50 tab-ml-30 mb-10" v-for="(appBlueprint, i) in appBlueprints" :key="appBlueprint.$id">
        <div class="panel-header no-body">
          <div class="panel-title">
            <i class="fas fa-drafting-compass"></i>
          </div>

          <div class="weight-1 horiz gutter-10 mx-10">

            <div class="label primary force-my-1">
              <div class="label-prefix">
                {{$t('classes.ApplicationBlueprint.columns.name')}}
              </div>
              <span>{{appBlueprint.name}}</span>
            </div>

            <div class="label primary force-my-1">
              <div class="label-prefix">
                {{$t('classes.ApplicationBlueprint.columns.role')}}
              </div>
              <span>{{appBlueprint.role}}</span>
            </div>

            <div class="label primary force-my-1" v-if="appBlueprint.dockerImageId">
              <div class="label-prefix">
                {{$t('classes.ApplicationBlueprint.columns.dockerImageId')}}
              </div>
              <span>{{appBlueprint.dockerImageId}}</span>
            </div>

            <div class="label primary force-my-1" v-if="appBlueprint.repositoryUrl">
              <div class="label-prefix">
                {{$t('classes.ApplicationBlueprint.columns.repositoryUrl')}}
              </div>
              <span>{{appBlueprint.repositoryUrl}}</span>
            </div>

          </div>

          <div class="horiz gutter-10">
            <button class="contrast icon">
              <i class="fas fa-edit"></i>
            </button>

            <button class="contrast icon">
              <i class="fas fa-eye"></i>
            </button>

            <button class="contrast icon" @click="removeApplicationBlueprint(appBlueprint)">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
    </await>

    <modal-remove-application-blueprint @confirm="confirmApplicationBlueprint"/>
  </section>
</template>

<script lang="ts">
import {Component, Vue} from 'vue-property-decorator'
import {Getter, Action} from 'vuex-class'
import Network from '@/model/Network'
import User from '@/model/User'
import ApplicationBlueprint from '@/model/ApplicationBlueprint'
import ModalRemoveApplicationBlueprint from '../components/modals/ModalRemoveApplicationBlueprint.vue'
import {$, sleep} from '@/simpli'

@Component({
  components: {ModalRemoveApplicationBlueprint},
})
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
    this.syncNetworks()
    this.syncAppBlueprints()
  }

  async addEmptyHost() {
    $.modal.open('persistNetwork')
  }

  async addHostFromStack() {
    /**/
  }

  async newApplicationBlueprint() {
    $.modal.open('persistApplicationBlueprint')
  }

  async removeApplicationBlueprint(item: ApplicationBlueprint) {
    $.modal.open('removeApplicationBlueprint', item)
  }

  async confirmApplicationBlueprint(item: ApplicationBlueprint) {
    await item.delete()
    this.syncAppBlueprints()
  }

  async test() {
    const net = new Network()
    await net.get('4wy8kD6xF')

    console.log(net)

    net.delete()
  }
}
</script>
