<template>
  <modal :title="$t('modal.persistApplicationBlueprint.title')" name="persistApplicationBlueprint" @open="openEvent"
         @close="closeEvent">
    <div class="horiz gutter-10">
      <input-text autofocus class="weight-1 contrast required"
                  :label="$t('classes.ApplicationBlueprint.columns.name')"
                  v-model="appBlueprint.name"/>

      <input-select class="weight-1 contrast required"
                    :label="$t('classes.ApplicationBlueprint.columns.role')"
                    v-model="roleComputed"
                    :items="roles"
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

    <template v-if="type === Type.DOCKER_REGISTER">
      <input-text class="contrast"
                  :label="$t('classes.ApplicationBlueprint.columns.repositoryUrl')"
                  v-model="appBlueprint.repositoryUrl"/>

      <div class="horiz gutter-10">
        <input-textarea class="weight-1 contrast"
                        :label="$t('classes.ApplicationBlueprint.columns.buildScript')"
                        v-model="appBlueprint.buildScript"/>

        <input-textarea class="weight-1 contrast"
                        :label="$t('classes.ApplicationBlueprint.columns.runCommands')"
                        v-model="appBlueprint.runCommands"/>
      </div>
    </template>

    <template v-else-if="type === Type.REPOSITORY_AND_BUILD_SCRIPT">
      <input-text class="contrast"
                  :label="$t('classes.ApplicationBlueprint.columns.dockerImageId')"
                  v-model="appBlueprint.dockerImageId"/>

      <input-textarea class="contrast"
                      :label="$t('classes.ApplicationBlueprint.columns.runCommands')"
                      v-model="appBlueprint.runCommands"/>
    </template>

    <hr>

    <await name="submit" class="horiz items-center gutter-10">
      <button type="button" @click="close">{{ $t('app.cancel') }}</button>
      <button type="button" class="success" @click="$await.run(submit, 'submit')">{{ $t('app.create') }}</button>
    </await>
  </modal>
</template>

<script lang="ts">
  import {Component, Prop, Vue} from 'vue-property-decorator'
  import {$, ResourceObject} from '../../simpli'
  import ApplicationBlueprint from '../../model/ApplicationBlueprint'
  import {Role} from '../../enum/Role'

  enum Type {
    DOCKER_REGISTER,
    REPOSITORY_AND_BUILD_SCRIPT,
  }

  @Component
  export default class ModalPersistApplicationBlueprint extends Vue {
    appBlueprint = new ApplicationBlueprint()

    Role = Role
    Type = Type

    role: ResourceObject | null = null
    type: Type | null = null

    get roleComputed() {
      return this.role
    }

    set roleComputed(val: ResourceObject | null) {
      this.appBlueprint.role = val && val.$tag as Role
      this.role = val
    }

    roles: ResourceObject[] = Object.values(Role).map((role, index) => ({$id: index, $tag: role}))

    closeEvent() {
      this.appBlueprint = new ApplicationBlueprint()
      this.role = null
      this.type = null

      this.$emit('close')
    }

    openEvent() {
      this.appBlueprint = new ApplicationBlueprint()
      this.role = null
      this.type = null

      this.$emit('open')
    }

    close() {
      $.modal.close('persistApplicationBlueprint')
    }

    async submit() {
      await this.appBlueprint.validate()
      await this.appBlueprint.persist()
      this.close()
    }
  }
</script>