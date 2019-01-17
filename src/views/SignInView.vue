<template>
  <div class="h-window">

    <div class="app-layout h-full">

      <div class="verti h-full weight-1 items-center p-10">
        <div class="m-10">
          <a href="https://neo.org/" target="_blank">
            <img src="../assets/img/neo@3x.png" alt="NEO Constallation" height="80">
          </a>
        </div>

        <div class="des-w-400 tab-w-300 mob-w-full">

          <form @submit.prevent="signIn(request)" class="panel spaced">
            <div class="panel-header">
              <div class="panel-title">
                {{$t('view.login.title')}}
              </div>
            </div>

            <await name="populateUser">
              <input-text
                      type="password"
                      selectall
                      v-model="request.accessKeyId"
              >{{$t('view.login.form.accessKey')}}
              </input-text>
              <input-text
                      type="password"
                      selectall
                      v-model="request.secretAccessKey"
              >{{$t('view.login.form.accessSecret')}}
              </input-text>

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
  import AuthRequest from '@/model/request/AuthRequest'
  import {pushByName} from '@/simpli'

  @Component
  export default class SignInView extends Vue {
    @Action('auth/signIn') signIn!: Function
    @Action('auth/init') init!: Function
    @Getter('auth/isLogged') isLogged!: string

    request = new AuthRequest()

    created() {
      this.init()
      if (this.isLogged) pushByName('dashboard')
    }
  }
</script>
