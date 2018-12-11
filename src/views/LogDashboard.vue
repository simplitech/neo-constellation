<template>
  <section class="container">

    <div class="horiz items-left-center">
      <h1 class="mr-20">Log Dashboard</h1>
      <button>Update All</button>
      <div class="verti weight-1">
        <label class="self-right">
          <input type="checkbox"/>
          <span>Automatic Update</span>
        </label>
      </div>
    </div>

    <div class="host p-5">
      <div class="horiz">
        <h2 class="weight-1 p-5">HostName</h2>
        <button>Add Log</button>
      </div>
      <div class="horiz">
        <div class="log p-5 weight-1 w-300 m-5">
          <label class="verti mb-10">
            <span>Log Command</span>
            <div class="horiz items-center">
              <input type="text" class="weight-1"/>
              <i class="fa fa-sync p-10"></i>
            </div>
          </label>

          <label class="verti">
            <span>Output</span>
            <textarea readonly class="h-300"></textarea>
          </label>
        </div>

        <div class="log p-5 weight-1 min-w-300 m-5">
          <label class="verti mb-10">
            <span>Log Command</span>
            <div class="horiz items-center">
              <input type="text" class="weight-1"/>
              <i class="fa fa-sync p-10"></i>
            </div>
          </label>

          <label class="verti">
            <span>Output</span>
            <textarea readonly class="h-300"></textarea>
          </label>
        </div>
      </div>
    </div>

  </section>
</template>

<script lang="ts">
  import {Component, Vue} from 'vue-property-decorator'
  import {Getter, Action} from 'vuex-class'
  import {$} from '@/simpli'

  @Component
  export default class DashboardView extends Vue {
    @Getter('auth/username') username?: string
  }
</script>
<style lang="scss">
  .host {
    border: 1px solid rgba(0,0,0,0.2);
    border-radius: 24px;
  }

  .log {
    background: rgba(255,255,255,0.2);
    border-radius: 12px;
  }
</style>