<template>
  <div class="login">
    <div class="verti w-window h-window items-center">

      <h1>{{$t('view.login.title')}}</h1>

      <div class="horiz items-center des-w-350 tab-w-400 w-full">
        <div class="weight-1 panel spaced">
          <form @submit.prevent="signIn(model)">
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

              <div class="text-center">
                <input type="submit" :value="$t('view.login.form.submit')"/>
              </div>
            </await>
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
