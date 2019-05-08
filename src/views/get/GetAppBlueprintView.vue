<template>
  <section class="container">
    <div class="row horiz items-center">
      <div class="col weight-1">
        <h2>
          <i class="fas fa-drafting-compass"></i>
          {{id}}
        </h2>
      </div>
      <div class="col">
        <button class="primary" @click="editApplicationBlueprint(appBlueprint)">
          <i class="fa fa-edit"></i>
          {{$t('view.getAppBlueprint.edit')}}
        </button>
      </div>
      <div class="col">
        <button class="primary" @click="cloneApplicationBlueprint(appBlueprint)">
          <i class="fa fa-clone"></i>
          {{$t('view.getAppBlueprint.editAndClone')}}
        </button>
      </div>
      <div class="col">
        <button class="primary" @click="removeApplicationBlueprint(appBlueprint)">
          <i class="fa fa-trash"></i>
          {{$t('view.getAppBlueprint.delete')}}
        </button>
      </div>
    </div>

    <await init name="get">
      <div class="panel des-ml-50 tab-ml-30 mb-10">
        <div class="panel-header">
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

        </div>

        <div class="row compact horiz items-center">
          <div class="col weight-1">
            <div class="label">
              <div class="label-prefix">
                {{$t('classes.ApplicationBlueprint.columns.dockerImageId')}}
              </div>
              <span>
                {{appBlueprint.dockerImageId}}
              </span>
            </div>
          </div>
        </div>

        <div class="row compact horiz">
          <div class="col weight-1">
            <div class="panel">
              <div class="panel-header">
                <div class="panel-title">
                  {{$t('classes.ApplicationBlueprint.columns.buildScript')}}
                </div>
              </div>

              <div v-html="appBlueprint.htmlBuildScript"></div>
            </div>
          </div>

          <div class="col weight-1">
            <div class="panel">
              <div class="panel-header">
                <div class="panel-title">
                  {{$t('classes.ApplicationBlueprint.columns.runCommands')}}
                </div>
              </div>

              <div v-html="appBlueprint.htmlRunCommands"></div>
            </div>
          </div>
        </div>

      </div>
    </await>

    <modal-persist-application-blueprint @submit="persistSubmit"/>
    <modal-remove-application-blueprint @confirm="confirmApplicationBlueprint"/>
  </section>
</template>

<script lang="ts">
  import {Component, Prop, Watch, Vue} from 'vue-property-decorator'
  import {Getter, Action} from 'vuex-class'
  import ApplicationBlueprint from '@/model/ApplicationBlueprint'
  import ModalPersistApplicationBlueprint, {Mode} from '@/components/modals/ModalPersistApplicationBlueprint.vue'
  import {pushByName, clone} from 'simpli-web-sdk'
  import ModalRemoveApplicationBlueprint from '@/components/modals/ModalRemoveApplicationBlueprint.vue'

  @Component({
    components: {ModalPersistApplicationBlueprint, ModalRemoveApplicationBlueprint},
  })
  export default class GetAppBlueprintView extends Vue {
    @Prop({type: String}) id?: string

    appBlueprint = new ApplicationBlueprint()

    async mounted() {
      await this.populate()
    }

    async populate() {
      const {id} = this
      if (id) {
        await this.$await.run(() => this.appBlueprint.get(id), 'get')
      }
      this.$await.done('get')
    }

    @Watch('id')
    async idEvent() {
      await this.populate()
    }

    editApplicationBlueprint(item: ApplicationBlueprint) {
      const model = clone(item)
      this.$modal.open('persistApplicationBlueprint', {model})
    }

    cloneApplicationBlueprint(item: ApplicationBlueprint) {
      const model = clone(item)
      this.$modal.open('persistApplicationBlueprint', {model, toClone: true})
    }

    removeApplicationBlueprint(item: ApplicationBlueprint) {
      this.$modal.open('removeApplicationBlueprint', item)
    }

    async confirmApplicationBlueprint(item: ApplicationBlueprint) {
      await item.delete()
      this.$router.push('/dashboard')
    }

    async persistSubmit(model: ApplicationBlueprint) {
      if (model.$id === this.id) {
        await this.populate()
      } else if (model.$id) {
        pushByName('getAppBlueprint', model.$id)
      }
    }
  }
</script>
