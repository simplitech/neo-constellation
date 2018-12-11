<template>
  <modal :name="name" @close="clearAndPopulate()">
    <div>

      <div class="row verti">
        <div class="col w-full" v-for="(command, i) in commands" :key="i">
          <button @click="populateLog(command)" class="small fluid">
            {{command.CommandId}}
          </button>
        </div>
      </div>

      <div class="verti">

        <div v-for="(event, j) in log" :key="j">
          <div class="row horiz">
            <div class="col min-w-150">
              <div class="label primary text-right">
                {{event.timelog}}
              </div>
            </div>

            <div class="col weight-1">
              <div v-for="(line, k) in event.message" :key="k">
                <div class="text-dark" :class="event.stream==='err' ? 'text-danger' : ''">
                  {{line}}
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      <div v-if="show">
        <textarea-group type="text" v-model="input" class="contrast">
          {{$t('view.cmd.command')}}
        </textarea-group>
        <button @click="sendCommand()" class="primary">
          {{$t('view.cmd.sendCommand')}}
        </button>
      </div>
    </div>
  </modal>
</template>

<script lang="ts">
  import {Component, Prop, Vue} from 'vue-property-decorator'
  import Node from '@/model/Node'
  import StreamEvent from '@/model/StreamEvent'
  import {$, sleep, abort} from '@/simpli'
  import {Command} from 'aws-sdk/clients/ssm'

  @Component
  export default class ModalCmd extends Vue {
    @Prop({required: true}) name?: string
    @Prop({required: true}) node?: Node

    commands: Command[] = []
    log: StreamEvent[] = []
    input: string = ''
    show: boolean = true

    async mounted() {
      await this.populateCommands()
    }

    async populateCommands() {
      this.commands = []

      const commandObjects = await this.node!.listCommands() || []

      for (const command of commandObjects) {
        this.commands.push(command)
      }
    }

    async populateLog(command: Command) {
      this.show = false
      this.log = await this.node!.getCommandOutputStream(command)
    }

    async sendCommand() {
      if (!this.input) abort('system.error.fieldNotDefined')
      await this.node!.sendCommand([this.input!])

      $.modal.close(this.name)
    }

    async clearAndPopulate() {
      this.log = []
      this.show = true
      await this.populateCommands()
    }
  }
</script>