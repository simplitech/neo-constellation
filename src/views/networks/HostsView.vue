<template>
  <section class="container">
    <div>
      <div class="row horiz items-center">
        <div class="col weight-1">
          <h2>
            <i class="fas fa-database"></i>
            {{$t('classes.Host.title')}}
          </h2>
        </div>
        <div class="col">
          <button class="primary" @click="addHost">
            {{$t('view.hosts.addHost')}}
          </button>
        </div>
      </div>

      <div class="row compact horiz items-center" v-for="(host, i) in environment.hosts" :key="i">
        <div class="col weight-1">
          <div class="panel compressed des-ml-50 tab-ml-30">

            <div class="panel-header">
              <div class="horiz w-full">
                <div class="col">
                  <div class="label" :class="$t(`classes.Host.stateClass.${host.state}`)">
                    <div class="label-prefix">
                      <i class="fa fa-database"></i>
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
                  <button @click="confirmTerminateHost(host)" class="flat small danger">
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
                        {{host.instanceId}}
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

    <modal-terminate-host @confirm="terminateHost"/>
    <modal-persist-host/>
  </section>
</template>

<script lang="ts">
import {Component, Vue} from 'vue-property-decorator'
import {Getter, Action} from 'vuex-class'
import Network from '@/model/Network'
import Host from '@/model/Host'
import ModalTerminateHost from '@/components/modals/ModalTerminateHost.vue'
import ModalPersistHost from '@/components/modals/ModalPersistHost.vue'

@Component({
  components: {ModalPersistHost, ModalTerminateHost},
})
export default class HostsView extends Vue {
  @Getter('auth/environment') environment!: Network | null

  async mounted() {
    if (this.environment) {
      for (const host of this.environment.hosts) {
        await host.manageState()
      }
    }
  }

  async addHost() {
    this.$modal.open('persistHost')
  }

  async terminateHost(host: Host) {
    await host.terminate()
  }

  confirmTerminateHost(host: Host) {
    this.$modal.open('terminateHost', host)
  }
}
</script>
