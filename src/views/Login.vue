<template>
  <div class="login">
    <div class="verti w-window h-window items-center">

      <h1>{{$t('view.login.title')}}</h1>

      <div class="horiz items-center des-w-350 tab-w-400 w-full">
        <div class="weight-1 panel spaced">
          <form>
            <input-group
                    required
                    type="password"
                    v-model="accessKey"
            >{{$t('view.login.form.accessKey')}}
            </input-group>
            <input-group
                    required
                    type="password"
                    v-model="accessSecret"
            >{{$t('view.login.form.accessSecret')}}
            </input-group>

            <div class="text-center">
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

  @Component
  export default class Login extends Vue {
    accessKey: string | null = null
    accessSecret: string | null = null
  }
</script>
