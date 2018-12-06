
import Command from '@/model/Command'
import Host from '@/model/Host'

export default class HostEntry {

    host: Host | null = null
    commands: Command[] = []

    constructor(host: Host | null, commands: Command[]) {
        this.host = host
        this.commands = commands.splice(0)
    }
}
