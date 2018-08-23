<template>
  <div class="app-container h-window">

    <div class="app-layout h-full">

      <div class="weight-1 items-center">
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
              <input type="submit" :value="$t('view.login.form.submit')"/>
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
