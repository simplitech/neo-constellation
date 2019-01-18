<template>
  <section class="container">
    <await name="listNetwork" effect="fade-up">
      <div class="row horiz">
        <div class="col">
          <button @click="addEmptyHost">
            {{$t('view.dashboard.addEmptyHost')}}
          </button>
        </div>
        <div class="col">
          <button @click="addHostFromStack">
            {{$t('view.dashboard.addHostFromStack')}}
          </button>
        </div>
      </div>

      <div class="panel mb-10" v-for="(network, i) in networks" :key="i">
        <div class="panel-header">
          <div class="mr-15">
            <div class="panel-title">
              <i class="fa fa-tasks"></i>
              {{$t('classes.Network.title')}}
            </div>
          </div>

          <div class="label primary force-mr-5">
            <div class="label-prefix">
              {{$t('classes.Network.columns.name')}}
            </div>
            <span>{{network.name}}</span>
          </div>

          <div class="label primary force-mr-5">
            <div class="label-prefix">
              {{$t('classes.Network.columns.$id')}}
            </div>
            <span>{{network.$id}}</span>
          </div>
        </div>

        <div class="row compact horiz items-center" v-for="(host, j) in network.hosts" :key="j">
          <div class="col weight-1">
            <div class="panel compressed">

              <div class="panel-header">
                <div class="horiz w-full">
                  <div class="col">
                    <div class="label" :class="$t(`classes.Host.stateClass.${host.state}`)">
                      <div class="label-prefix">
                        <i class="fa fa-database"></i>
                        {{$t('classes.Host.title')}}
                      </div>
                      <strong>
                        {{$t(`classes.Host.state.${host.state}`)}}
                      </strong>
                    </div>
                  </div>

                  <div class="col">
                    <await :name="`host_${host.$id}`" :spinnerScale="0.5"/>
                  </div>

                  <div class="col weight-1">
                    <template v-if="[80].includes(host.state)">
                      <button @click="host.turnOn()" class="basic small success">
                        <i class="fa fa-play"></i>
                        {{$t('app.turnOn')}}
                      </button>
                    </template>

                    <template v-else-if="[16].includes(host.state)">
                      <button @click="host.turnOff()" class="basic small warning">
                        <i class="fa fa-pause"></i>
                        {{$t('app.turnOff')}}
                      </button>
                    </template>
                  </div>

                  <div class="col" v-if="[16, 80].includes(host.state)">
                    <button @click="host.terminate()" class="flat small danger">
                      <i class="fa fa-remove"></i>
                      {{$t('app.terminate')}}
                    </button>
                  </div>
                </div>
              </div>

              <div>

                <div class="row compact horiz">

                  <div class="col weight-1">
                    <div class="label">
                      <div class="label-prefix">
                        {{$t('classes.Host.columns.name')}}
                      </div>
                      <span>
                          {{host.name}}
                        </span>
                    </div>
                  </div>

                  <div class="col weight-1">
                    <div class="label">
                      <div class="label-prefix">
                        {{$t('classes.Host.columns.$id')}}
                      </div>
                      <span>
                        {{host.$id}}
                      </span>
                    </div>
                  </div>

                </div>

                <div class="row compact horiz">

                  <div class="col weight-1">
                    <div class="label">
                      <div class="label-prefix">
                        {{$t('classes.Host.columns.imageId')}}
                      </div>
                      <span>
                          {{host.imageId}}
                        </span>
                    </div>
                  </div>

                  <div class="col weight-1">
                    <div class="label">
                      <div class="label-prefix">
                        {{$t('classes.Host.columns.securityGroupId')}}
                      </div>
                      <span>
                          {{host.securityGroupId}}
                        </span>
                    </div>
                  </div>

                </div>

                <div class="row compact horiz">

                  <div class="col weight-1">
                    <div class="label">
                      <div class="label-prefix">
                        {{$t('classes.Host.columns.size')}}
                      </div>
                      <span>
                        {{host.size}}
                      </span>
                    </div>
                  </div>

                  <div class="col weight-1">
                    <div class="label">
                      <div class="label-prefix">
                        {{$t('classes.Host.columns.region')}}
                      </div>
                      <span>
                        {{host.region}}
                      </span>
                    </div>
                  </div>

                </div>

                <div class="row compact horiz" v-if="[16].includes(host.state)">
                  <div class="col weight-1">
                    <div class="label">
                      <div class="label-prefix">
                        {{$t('classes.Host.columns.ipv4')}}
                      </div>
                      <span>
                        {{host.ipv4}}
                      </span>
                    </div>
                  </div>
                </div>

                <div class="row compact horiz" v-if="[16].includes(host.state)">
                  <div class="col weight-1">
                    <div class="label truncate">
                      <div class="label-prefix">
                        {{$t('classes.Host.columns.publicdns')}}
                      </div>
                      <span>
                        {{host.publicDns}}
                      </span>
                    </div>
                  </div>
                </div>

              </div>

              <div class="panel-footer">
              </div>
            </div>
          </div>
        </div>
      </div>

    </await>
  </section>
</template>

<script lang="ts">
  import {Component, Vue} from 'vue-property-decorator'
  import {Getter, Action} from 'vuex-class'
  import NetworkOld from '@/model/NetworkOld'
  import Network from '@/model/Network'
  import Host from '@/model/Host'
  import Rule from '@/model/Rule'
  import SecurityGroup from '@/model/SecurityGroup'
  import User from '@/model/User'
  import {log} from '@/simpli'
  import {Size} from '@/enum/Size'
  import {Region} from '@/enum/Region'
  import {Zone} from '@/enum/Zone'
  import {$, sleep} from '@/simpli'

  @Component
  export default class DashboardView extends Vue {
    @Getter('auth/user') user!: User
    @Getter('auth/networks') networks!: Network[]

    @Action('auth/syncNetworks') syncNetworks!: Function
    @Action('auth/manageFloatingStates') manageFloatingStates!: Function

    async mounted() {
      await this.populate()
    }

    async populate() {
      await this.syncNetworks()

      // Waiting the next DOM render
      await sleep(500)

      this.manageFloatingStates()
    }

    async addEmptyHost() {
      $.modal.open('persistNetwork')
    }

    async addHostFromStack() {
      /**/
    }

    async test() {
      let networkId: String | null

      let network = new Network()

      network.name = 'NetworkName'

      await network.persist()

      log('NetworkOld', network)
      networkId = network.$id

      const inRule = new Rule()
      inRule.source = '0.0.0.0/0'
      inRule.portRangeStart = 8080
      inRule.portRangeEnd = 8443

      const sg = new SecurityGroup()
      sg.name = 'SecurityGroupTest1'
      sg.inbound.push(inRule)
      sg.networkId = network.$id

      network.securityGroups.push(sg)

      await network.persist()

      log('NetworkOld', network)

      const host = new Host()
      host.name = 'HostTest1'
      host.region = Region.SA_EAST_1
      host.size = Size.T2_NANO
      host.availabilityZone = Zone.SA_EAST_1A
      host.imageId = 'ami-07b14488da8ea02a0'
      host.securityGroup = network.securityGroups[0]

      await network.addHost(host)

      await network.persist()

      log('NetworkOld', network)

      network = new Network()

      await network.get(networkId!)
      await network.build()

    }
  }
</script>
