<template>
    <modal :name="name" @close="clearLog()">
        <div class="verti">
            <div v-for="(command, i) in commands" :key="i">
                <button @click="populateLog(command)" class="primary weight-full">
                    {{command}}
                </button>
            </div>
            <div class="verti">
                <div v-for="(event, j) in log" :key="j">
                    <div class="row horiz">
                        <div class="col min-w-200">
                            <div class="label primary text-right">
                                {{event.timelog}}
                            </div>
                        </div>
                        <div class="col weight-1">
                            <div v-for="(line, k) in event.message" :key="k">
                                <div :class="event.stream==='err' ? 'text-danger' : ''">
                                    {{line}}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="horiz">
                <input-group @click="clearLog()" class="weight-1" type="text" v-model="input"/>
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

@Component
export default class ModalCmd extends Vue {
    @Prop({required: true}) name?: string
    @Prop({required: true}) node?: Node

    commands: string[] = []
    log: StreamEvent[] = []
    input: string = ''

    async mounted() {
        await this.populateCommands()
    }

    async open() {
        this.log = []
        await this.populateCommands()
    }

    async populateCommands() {
        this.commands = []

        const commandObjects = await this.node!.listCommands() || []

        for (const command of commandObjects) {
            if (command.CommandId) {
                this.commands.push(command.CommandId)
            }
        }
    }

    async populateLog(idCommand: string) {
        this.log = await this.node!.getCommandOutput(idCommand)
    }

    async sendCommand() {
        if (!this.input) abort('system.error.fieldNotDefined')
        await this.node!.sendCommand([this.input!])

        $.modal.close(this.name)
    }

    async clearLog() {
        this.log = []
    }
}
</script>