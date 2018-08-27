<template>
    <modal :name="name">
        
        <div class="horiz">
            <div class="row compact verti items-center">
                <div class="w-full" v-for="(command, i) in commands" :key="i">
                    <button @click="getCommandOutput(command)" class="primary">
                        {{command}}
                    </button>
                </div>
            </div>
        </div>
        <div class="row horiz">
            <div class="col weight-1">
            <input-group
                type="text"
                v-model="input"
            />
            </div>
            <div class="col">
                <button @click="sendCommand" class="primary">
                    {{$t('view.cmd.sendCommand')}}
                </button>
            </div>
            
        </div>
        <div class="verti">
            <div v-for="(item,j) in events" :key="j">
                {{item}}
            </div>
        </div>
        
    </modal>
</template>

<script lang="ts">
import {Component, Prop, Vue} from 'vue-property-decorator'
import Node from '@/model/Node'
import {$, sleep} from '@/simpli'

@Component
export default class ModalCmd extends Vue {
    @Prop({required: true}) name?: string
    @Prop({required: true}) node?: Node

    commands: string[] = []
    events: string[] = []
    input: string = ''

    async mounted() {
        await this.populate()
    }

    async populate() {
        const data = await this.node!.listCommands()

        if (data) {
            data.forEach((c) => {
                if (c.CommandId) {
                   this.commands.push(c.CommandId)
                }
            })
        }
    }

    async getCommandOutput(command: string) {
        this.events = await this.node!.getCommandOutput(command)
    }

    async sendCommand() {
        await this.node!.sendCommand([this.input])
        await this.populate()
        $.modal.close()
    }
}
</script>