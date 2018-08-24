<template>
  <div class="app-container">
    <div class="app-layout app-layout-large">

      <div class="row horiz">
        <div class="col">
          <button @click="signOut()">Logout</button>
        </div>
        <div class="col">
          <button @click="populateList">Reload List</button>
        </div>
        <div class="col">
          <button @click="sendCommand">Send Command</button>
        </div>
      </div>

      <div class="panel">
        <div class="panel-header">
          <div class="panel-title col weight-1">Network</div>
          <div>
            <router-link class="btn primary" to="/node/new">Create Node</router-link>
          </div>
        </div>

        <await name="nodeList">
          <div class="row horiz items-center" v-for="(item, i) in list" :key="i">
            <div class="col weight-1">
              <div class="panel">
                <div class="panel-title">
                  <span>Node</span>
                  {{i}}
                </div>

                <div>
                  <strong>ID Network: </strong>
                  <span>
                    {{item.idNetwork}}
                  </span>
                </div>

                <div>
                  <strong>ID Image: </strong>
                  <span>
                    {{item.idImage}}
                  </span>
                </div>

                <div>
                  <strong>ID Security Group: </strong>
                  <span>
                    {{item.idSecurityGroup}}
                  </span>
                </div>

                <div>
                  <strong>ID Instance: </strong>
                  <span>
                    {{item.idInstance}}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </await>
      </div>

    </div>
  </div>
</template>

<script lang="ts">
  import {Component, Vue} from 'vue-property-decorator'
  import {Action} from 'vuex-class'
  import Node from '@/model/Node'
  import {$} from '@/simpli'

  @Component
  export default class DashboardView extends Vue {
    @Action('auth/signOut') signOut?: Function

    list: Node[] = []

    async mounted() {
      await this.populateList()
    }

    async populateList() {
      const fetch = async () => {
        this.list = await Node.list()
      }

      await $.await.run(fetch, 'nodeList', 2000)
    }

    async sendCommand() {
      await new Node().sendShellScript('a')
    }
  }
</script>
