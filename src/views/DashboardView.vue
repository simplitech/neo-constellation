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
          <button @click="populate">
            {{$t('view.dashboard.reloadList')}}
          </button>
        </div>
        <div class="col">
          <button @click="sendCommand">
            {{$t('view.dashboard.sendCommand')}}
          </button>
        </div>
      </div>

      <await name="networks" effect="fade-y-up">

        <div class="panel mb-10" v-for="(network, i) in networks" :key="i">
          <div class="panel-header">
            <div class="mr-15">
              <div class="panel-title">
                <i class="fa fa-tasks"></i>
                {{$t('classes.Network.title')}}
              </div>
            </div>

            <div class="label primary">
              <div class="label-prefix">
                {{$t('classes.Network.columns.$id')}}
              </div>
              <span>{{network.$id}}</span>
            </div>
          </div>

          <div class="row compact horiz items-center" v-for="(node, j) in network.nodes" :key="j">
            <div class="col weight-1">
              <div class="panel compressed">

                <div class="panel-header">
                  <div class="horiz w-full">
                    <div class="col">
                      <div class="label" :class="$t(`classes.Node.stateClass.${node.state}`)">
                        <div class="label-prefix">
                          <i class="fa fa-database"></i>
                          {{$t('classes.Node.title')}}
                        </div>
                        <strong>
                          {{$t(`classes.Node.state.${node.state}`)}}
                        </strong>
                      </div>
                    </div>

                    <div class="col">
                      <await :name="`node_${node.$id}`" :spinnerScale="0.5"/>
                    </div>

                    <div class="col weight-1">
                      <template v-if="[80].includes(node.state)">
                        <button @click="node.turnOn()" class="basic success">
                          <i class="fa fa-play"></i>
                          {{$t('app.turnOn')}}
                        </button>
                      </template>

                      <template v-else-if="[16].includes(node.state)">
                        <button @click="node.turnOff()" class="basic warning">
                          <i class="fa fa-pause"></i>
                          {{$t('app.turnOff')}}
                        </button>
                      </template>
                    </div>

                    <div class="col" v-if="[16, 80].includes(node.state)">
                      <button @click="node.terminate()" class="basic danger">
                        <i class="fa fa-remove"></i>
                        {{$t('app.terminate')}}
                      </button>
                    </div>
                  </div>
                </div>

                <div class="horiz">

                  <div class="col weight-1">
                    <div class="label">
                      <div class="label-prefix">
                        {{$t('classes.Node.columns.name')}}
                      </div>
                      <span>
                          {{node.name}}
                        </span>
                    </div>
                  </div>

                  <div class="col weight-1">
                    <div class="label">
                      <div class="label-prefix">
                        {{$t('classes.Node.columns.$id')}}
                      </div>
                      <span>
                        {{node.$id}}
                      </span>
                    </div>
                  </div>

                </div>

                <div class="horiz">

                  <div class="col weight-1">
                    <div class="label">
                      <div class="label-prefix">
                        {{$t('classes.Node.columns.idImage')}}
                      </div>
                      <span>
                          {{node.idImage}}
                        </span>
                    </div>
                  </div>

                  <div class="col weight-1">
                    <div class="label">
                      <div class="label-prefix">
                        {{$t('classes.Node.columns.idSecurityGroup')}}
                      </div>
                      <span>
                          {{node.idSecurityGroup}}
                        </span>
                    </div>
                  </div>

                </div>

                <div class="horiz">

                  <div class="col weight-1">
                    <div class="label">
                      <div class="label-prefix">
                        {{$t('classes.Node.columns.size')}}
                      </div>
                      <span>
                        {{node.size}}
                      </span>
                    </div>
                  </div>

                  <div class="col weight-1">
                    <div class="label">
                      <div class="label-prefix">
                        {{$t('classes.Node.columns.region')}}
                      </div>
                      <span>
                        {{node.region}}
                      </span>
                    </div>
                  </div>

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
  import {$, sleep} from '@/simpli'

  @Component
  export default class DashboardView extends Vue {
    @Getter('auth/username') username?: string

    networks: Network[] = []

    async mounted() {
      await this.populate()
    }

    async populate() {
      this.networks = await Network.list()

      // Waiting the next DOM render
      await sleep(500)

      // Verifies all the floating states and prepares them to the state
      Network.manageStateFromList(this.networks)
    }

    async sendCommand() {
      await new Node().sendShellScript('a')
    }
  }
</script>
