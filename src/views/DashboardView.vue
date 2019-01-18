<template>
  <section class="container">
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
        <button @click="test">
          Testing
        </button>
      </div>
    </div>

    <await name="networks" effect="fade-up">

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
          <modal-cmd :name="`cmd_${node.$id}`" :node="node"/>
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
                      <button @click="node.turnOn()" class="basic small success">
                        <i class="fa fa-play"></i>
                        {{$t('app.turnOn')}}
                      </button>
                    </template>

                    <template v-else-if="[16].includes(node.state)">
                      <button @click="node.turnOff()" class="basic small warning">
                        <i class="fa fa-pause"></i>
                        {{$t('app.turnOff')}}
                      </button>
                    </template>
                  </div>

                  <div class="col" v-if="[16, 80].includes(node.state)">
                    <button @click="node.terminate()" class="flat small danger">
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

                <div class="row compact horiz">

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

                <div class="row compact horiz">

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

                <div class="row compact horiz" v-if="[16].includes(node.state)">
                  <div class="col weight-1">
                    <div class="label">
                      <div class="label-prefix">
                        {{$t('classes.Node.columns.ipv4')}}
                      </div>
                      <span>
                        {{node.ipv4}}
                      </span>
                    </div>
                  </div>
                </div>

                <div class="row compact horiz" v-if="[16].includes(node.state)">
                  <div class="col weight-1">
                    <div class="label truncate">
                      <div class="label-prefix">
                        {{$t('classes.Node.columns.publicdns')}}
                      </div>
                      <span>
                        {{node.publicDns}}
                      </span>
                    </div>
                  </div>
                </div>

                <div class="verti panel compressed" v-if="node.containers.length">
                  <div class="panel-header">
                    <div class="panel-title">
                      {{$t('view.dashboard.containers')}}
                    </div>
                  </div>

                  <div class="horiz items-space-around" v-for="(container, k) in node.containers" :key="k">
                    <div class="col weight-1">
                      <div class="label">
                        <div class="label-prefix">
                          {{$t('classes.Container.columns.names')}}
                        </div>
                        <span>
                        {{container.names}}
                      </span>
                      </div>
                    </div>
                    <div class="col weight-1">
                      <div class="label">
                        <div class="label-prefix">
                          {{$t('classes.Container.columns.$id')}}
                        </div>
                        <span>
                        {{container.id}}
                      </span>
                      </div>
                    </div>
                    <div class="col weight-1">
                      <div class="label">
                        <div class="label-prefix">
                          {{$t('classes.Container.columns.ports')}}
                        </div>
                        <span>
                        {{container.ports}}
                      </span>
                      </div>
                    </div>
                  </div>

                </div>

              </div>

              <div class="panel-footer">
                <div class="horiz w-full">
                  <div class="col">
                    <button @click="listCommands(node)" class="primary">
                      {{$t('view.dashboard.commands')}}
                    </button>
                  </div>
                  <div class="col">
                    <button @click="test(node)" class="primary">
                      Test
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </await>
  </section>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { Getter, Action } from 'vuex-class'
import NetworkOld from '@/model/NetworkOld'
import Network from '@/model/Network'
import Host from '@/model/Host'
import Node from '@/model/Node'
import Rule from '@/model/Rule'
import SecurityGroup from '@/model/SecurityGroup'
import Container from '@/model/Container'
import { $, sleep } from '@/simpli'
import Collection from '@/app/Collection'
import { log } from '@/simpli'
import { Size } from '@/enum/Size'
import {Region} from '@/enum/Region'
import {State} from '@/enum/State'
import Dashboard from '@/model/Dashboard'
import Command from '@/model/Command'
import HostEntry from '@/model/HostEntry'
import User from '@/model/User'
import Initializer from '@/app/Initializer'
import { Zone } from '@/enum/Zone'
import ApplicationBlueprint from '@/model/ApplicationBlueprint'
import Stack from '@/model/Stack'

@Component
export default class DashboardView extends Vue {
  @Getter('auth/user')
  user?: User

  networks: NetworkOld[] = []

  async mounted() {
    await this.populate()
  }

  async populate() {
    this.networks = await NetworkOld.list()

    // Waiting the next DOM render
    await sleep(500)

    // Verifies all the floating states and prepares them to the state
    NetworkOld.manageStateFromList(this.networks)
  }

  async sendCommand(node: Node) {
    const command = await node.sendCommand([
      'apt-get install dialog apt-utils -y',
      'apt-get -y install mysql-server',
    ])

    if (command) {
      this.$snotify.info(command.CommandId)
      console.log(command.CommandId)
      sleep(20000)
      node.getCommandOutputStream(command)
    }
  }

  async listCommands(node: Node) {
    $.modal.open(`cmd_${node.$id}`)
  }

    async test() {
        /*let networkId: String | null

        let network = new Network()

        network.name = 'NetworkName6'

        await network.persist()

        log('NetworkOld', network)
        networkId = network.$id

        const inRule = new Rule()
        inRule.source = '0.0.0.0/0'
        inRule.portRangeStart = 8080
        inRule.portRangeEnd = 8443

        const sg = new SecurityGroup()
        sg.name = 'SecurityGroupTest6'
        sg.inbound.push(inRule)

        network.addSecurityGroup(sg)

        await network.persist()

        log('NetworkOld', network)

        const host = new Host()
        host.name = 'HostTest6'
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
        await network.build()*/

        const net = new Network()
        const list = await net.list()

        log(list)

        if (list) {
            for (const network of list) {
                log(network)
                await network.delete()
            }
        }

    }

}
</script>
