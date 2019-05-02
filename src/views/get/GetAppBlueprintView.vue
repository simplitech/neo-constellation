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
        <button class="primary">
          {{$t('view.getAppBlueprint.delete')}}
        </button>
      </div>
      <div class="col">
        <button class="primary">
          {{$t('view.getAppBlueprint.cloneAndEdit')}}
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

  </section>
</template>

<script lang="ts">
  import {Component, Prop, Vue} from 'vue-property-decorator'
  import {Getter, Action} from 'vuex-class'
  import ApplicationBlueprint from '@/model/ApplicationBlueprint'

  @Component
  export default class GetAppBlueprintView extends Vue {
    @Prop({type: String}) id?: string

    appBlueprint = new ApplicationBlueprint()

    async mounted() {
      if (this.id) {
        await this.$await.run(() => this.appBlueprint.get(this.id), 'get')
      }
      this.$await.done('get')
    }
  }
</script>
