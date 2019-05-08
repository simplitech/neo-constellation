<template>
  <modal :title="title" name="persistApplicationBlueprint" @open="openEvent"
         @close="closeEvent" :closeOutside="false">
    <div class="horiz gutter-10">
      <input-text autofocus class="weight-1 contrast required"
                  type="text"
                  :label="$t('classes.ApplicationBlueprint.columns.name')"
                  v-model="appBlueprint.name"/>

      <input-select class="weight-1 contrast required"
                    :label="$t('classes.ApplicationBlueprint.columns.role')"
                    v-model="roleResource"
                    :items="allRole.items"
      />
    </div>

    <div class="mb-10 contrast text-center">
      <label>
        {{ $t('modal.persistApplicationBlueprint.sourceCodeFormat') }}
      </label>
    </div>

    <div class="horiz gutter-10">
      <div class="weight-1">
        <div class="form-group">
          <label>
            <input type="radio" v-model="type" :value="Type.DOCKER_REGISTER">
            <span class="btn">
              {{ $t('modal.persistApplicationBlueprint.dockerRegister') }}
            </span>
          </label>
        </div>
      </div>

      <div class="weight-1">
        <div class="form-group">
          <label>
            <input type="radio" v-model="type" :value="Type.REPOSITORY_AND_BUILD_SCRIPT">
            <span class="btn">
              {{ $t('modal.persistApplicationBlueprint.repositoryAndBuildScript') }}
            </span>
          </label>
        </div>
      </div>
    </div>

    <template v-if="type === Type.REPOSITORY_AND_BUILD_SCRIPT">
      <input-text class="contrast"
                  type="text"
                  :label="$t('classes.ApplicationBlueprint.columns.repositoryUrl')"
                  v-model="appBlueprint.repositoryUrl"/>

      <div class="horiz gutter-10">
        <input-textarea class="weight-1 contrast"
                        :label="$t('classes.ApplicationBlueprint.columns.buildScript')"
                        v-model="appBlueprint.stringBuildScript"/>

        <input-textarea class="weight-1 contrast"
                        :label="$t('classes.ApplicationBlueprint.columns.runCommands')"
                        v-model="appBlueprint.stringRunCommands"/>
      </div>
    </template>

    <template v-else-if="type === Type.DOCKER_REGISTER">
      <input-text class="contrast"
                  type="text"
                  :label="$t('classes.ApplicationBlueprint.columns.dockerImageId')"
                  v-model="appBlueprint.dockerImageId"/>

      <input-textarea class="contrast"
                      :label="$t('classes.ApplicationBlueprint.columns.runCommands')"
                      v-model="appBlueprint.stringRunCommands"/>
    </template>

    <hr>

    <await name="submit" spinnerColor="#59BF00" class="horiz items-center gutter-10">
      <button type="button" @click="close">{{ $t('app.cancel') }}</button>
      <button type="button" class="success" @click="$await.run(submit, 'submit')">{{ buttonText }}</button>
    </await>
  </modal>
</template>

<script lang="ts">
  import {Component, Prop, Vue} from 'vue-property-decorator'
  import {$, ObjectCollection, IResource} from '../../simpli'
  import ApplicationBlueprint from '../../model/ApplicationBlueprint'
  import {Role} from '../../enum/Role'

  export enum Type {
    DOCKER_REGISTER = 1,
    REPOSITORY_AND_BUILD_SCRIPT = 2,
  }

  export enum Mode {
    CREATE = 1,
    EDIT = 2,
    CLONE = 3,
  }

  export interface ModalOptions {
    model?: ApplicationBlueprint
    toClone?: boolean
  }

  @Component
  export default class ModalPersistApplicationBlueprint extends Vue {
    appBlueprint = new ApplicationBlueprint()

    Role = Role
    Type = Type
    Mode = Mode

    type: Type | null = null
    mode: Mode = Mode.CREATE

    allRole = new ObjectCollection(Role).prependNull('')

    get roleResource() {
      return this.allRole.get(this.appBlueprint.role)
    }
    set roleResource(val: IResource | null) {
      this.appBlueprint.role = val && val.$id as Role || null
    }

    get title() {
      if (this.mode === Mode.CREATE) {
        return this.$t('modal.persistApplicationBlueprint.titleCreate')
      }

      if (this.mode === Mode.EDIT) {
        return this.$t('modal.persistApplicationBlueprint.titleEdit')
      }

      if (this.mode === Mode.CLONE) {
        return this.$t('modal.persistApplicationBlueprint.titleClone')
      }

      return this.$t('modal.persistApplicationBlueprint.title')
    }

    get buttonText() {
      if (this.mode === Mode.CREATE) {
        return this.$t('app.create')
      }

      if (this.mode === Mode.EDIT) {
        return this.$t('app.edit')
      }

      if (this.mode === Mode.CLONE) {
        return this.$t('app.clone')
      }

      return this.$t('app.create')
    }

    closeEvent() {
      this.appBlueprint = new ApplicationBlueprint()
      this.type = null

      this.$emit('close')
    }

    openEvent(options: ModalOptions = {}) {
      this.appBlueprint = options.model || new ApplicationBlueprint()

      if (this.appBlueprint.repositoryUrl) {
        this.type = Type.REPOSITORY_AND_BUILD_SCRIPT
      } else if (this.appBlueprint.dockerImageId) {
        this.type = Type.DOCKER_REGISTER
      } else {
        this.type = null
      }

      if (options.toClone) {
        this.mode = Mode.CLONE
        this.appBlueprint.$id = null
      } else if (options.model && options.model.$id) {
        this.mode = Mode.EDIT
      } else {
        this.mode = Mode.CREATE
        this.appBlueprint.$id = null
      }

      this.$emit('open')
    }

    close() {
      $.modal.close('persistApplicationBlueprint')
    }

    async submit() {
      await this.appBlueprint.validate()
      await this.appBlueprint.persist()
      this.$emit('submit', this.appBlueprint)
      this.close()
    }
  }
</script>
