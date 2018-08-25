<template>
  <div class="app-container">
    <div class="app-layout app-layout-large">

      <div class="row horiz">
        <div class="col">
          <router-link class="btn primary" to="/node/new">
            {{$t('view.dashboard.createNode')}}
          </router-link>
        </div>
        <div class="col">
          <button @click="populateList">
            {{$t('view.dashboard.reloadList')}}
          </button>
        </div>
        <div class="col">
          <button @click="sendCommand">
            {{$t('view.dashboard.sendCommand')}}
          </button>
        </div>
      </div>

      <await name="networks">

        <div class="panel mb-10" v-for="(network, i) in networks" :key="i">
          <div class="panel-header">
            <div class="panel-title col weight-1">
              <i class="fa fa-cubes"></i>
              {{$t('classes.Network.title')}}
            </div>
            <span>
                  #{{network.$id}}
                </span>
          </div>

          <div class="row horiz items-center" v-for="(node, j) in network.nodes" :key="j">
            <div class="col weight-1">
              <div class="panel">
                <div class="panel-title">
                  <span>
                    {{$t('classes.Node.columns.name')}}
                  </span>
                  ({{node.name}})
                </div>

                <div>
                  <strong>{{$t('classes.Node.columns.$id')}}:</strong>
                  <span>
                    {{node.idInstance}}
                  </span>
                </div>

                <div>
                  <strong>{{$t('classes.Node.columns.idNetwork')}}:</strong>
                  <span>
                    {{node.idNetwork}}
                  </span>
                </div>

                <div>
                  <strong>{{$t('classes.Node.columns.idImage')}}</strong>
                  <span>
                    {{node.idImage}}
                  </span>
                </div>

                <div>
                  <strong>{{$t('classes.Node.columns.idSecurityGroup')}}</strong>
                  <span>
                    {{node.idSecurityGroup}}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </await>

    </div>
  </div>
</template>

<script lang="ts">
  import {Component, Vue} from 'vue-property-decorator'
  import {Getter, Action} from 'vuex-class'
  import Network from '@/model/Network'
  import Node from '@/model/Node'
  import {$} from '@/simpli'

  @Component
  export default class DashboardView extends Vue {
    @Getter('auth/username') username?: string

    networks: Network[] = []

    async mounted() {
      await this.populateList()
    }

    async populateList() {
      const fetch = async () => {
        this.networks = await Network.list()
      }

      await $.await.run(fetch, 'networks')
    }

    async sendCommand() {
      await new Node().sendShellScript('a')
    }
  }
</script>
