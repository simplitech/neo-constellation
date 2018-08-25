<template>
  <div class="h-window">

    <div class="app-layout h-full">

      <div class="verti weight-1 items-center p-10">
        <div class="m-10">
          <a href="https://neo.org/" target="_blank">
            <img src="../assets/img/neo@3x.png" alt="NEO Constallation" height="80">
          </a>
        </div>

        <div class="des-w-400 tab-w-300 mob-w-full">

          <form @submit.prevent="signIn(model)" class="panel spaced">
            <div class="panel-header">
              <div class="panel-title">
                {{$t('view.login.title')}}
              </div>
            </div>

            <await name="login">
              <input-group
                      type="password"
                      v-model="model.accessKeyId"
              >{{$t('view.login.form.accessKey')}}
              </input-group>
              <input-group
                      type="password"
                      v-model="model.secretAccessKey"
              >{{$t('view.login.form.accessSecret')}}
              </input-group>

            </await>

            <div class="panel-footer items-end">
              <await name="login" spinner="BeatLoader">
                <input type="submit" class="primary" :value="$t('view.login.form.submit')"/>
              </await>
            </div>
          </form>

        </div>
      </div>

    </div>
  </div>
</template>

<script lang="ts">
  import {Component, Prop, Vue} from 'vue-property-decorator'
  import {Getter, Action} from 'vuex-class'
  import Authentication from '@/model/Authentication'
  import {pushByName} from '@/simpli'

  @Component
  export default class LoginView extends Vue {
    @Action('auth/signIn') signIn?: Function
    @Getter('auth/isLogged') isLogged?: string

    model = new Authentication()

    created() {
      if (this.isLogged!) pushByName('dashboard')
    }
  }
</script>
