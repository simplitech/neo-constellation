<template>
  <div>
    <div class="p-10">
      <div class="row horiz">
        <div class="col">
          <button @click="signOut()">Logout</button>
          <button @click="populateList">Reload List</button>
        </div>
      </div>
    </div>

    <div class="container">
      <div class="horiz items-center">
        <div class="weight-1 panel">
          <div style="float: right;">
            <button class="primary" @click="create">Create Node</button>
          </div>

          <div class="panel-title">Network</div>

          <div style="clear: both"></div>

          <await name="nodeList" class="horiz items-center" v-for="(node, i) in list" :key="i">
            <div class="weight-1">
              <div class="panel">
                <div class="panel-title">
                  <span>Node</span>
                  {{i}}
                </div>

                <div>
                  <strong>ID Network: </strong>
                  <span>
                    {{node.idNetwork}}
                  </span>
                </div>

                <div>
                  <strong>ID Image: </strong>
                  <span>
                    {{node.idImage}}
                  </span>
                </div>

                <div>
                  <strong>ID Security Group: </strong>
                  <span>
                    {{node.idSecurityGroup}}
                  </span>
                </div>

                <div>
                  <strong>ID Instance: </strong>
                  <span>
                    {{node.idInstance}}
                  </span>
                </div>
              </div>
            </div>
          </await>

        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
  import {Component, Prop, Vue} from 'vue-property-decorator'
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

    async create() {
      await new Node().create(true)
      await this.populateList()
    }

    async populateList() {
      try {
        $.await.init('nodeList')
        this.list = await Node.list()
        $.await.done('nodeList')
      } catch (e) {
        $.await.error('nodeList')
        throw e
      }
    }
  }
</script>
