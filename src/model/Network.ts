import {
    $,
    uid,
    info,
    sleep,
    abort,
    Model,
    getUser,
    ResponseSerialize,
    ValidationRequired,
    ValidationMaxLength,
} from '@/simpli'
import Host from '@/model/Host'
import SecurityGroup from '@/model/SecurityGroup'
import Dashboard from '@/model/Dashboard'
import ConfigurationFile from '@/model/ConfigurationFile'
import AwsGlobal from '@/model/AwsGlobal'
import { plainToClass, classToPlain, serialize, deserialize } from 'class-transformer'
import _ from 'lodash'
import { success } from '@/simpli'
import { S3Wrapper } from '@/app/S3Wrapper'
import Command from './Command'
import { State } from '@/enum/State'
import { Log } from '@/helpers/logger.helper'

export default class Network extends S3Wrapper {

    $id: string | null = null
    name: string | null = null
    runningSince: Date | null = null

    @ResponseSerialize(SecurityGroup)
    securityGroups: SecurityGroup[] = []

    @ResponseSerialize(Host)
    hosts: Host[] = []

    @ResponseSerialize(Dashboard)
    dashboards: Dashboard[] = []

    @ResponseSerialize(ConfigurationFile)
    configurationFiles: ConfigurationFile[] = []

    protected readonly $prefix = 'networks/'

    get isRunning(): boolean {return !!this.runningSince}

    async get(id: String) {
        const network = await super.get(id)

        if (this.isRunning) {
            await network.synchronizeHosts()
        }

        return network
    }

    async delete() {
        // If network is running, we need to also delete AWS resources
        if (this.isRunning) {
            let promises = []

            Log(0, 'Terminating hosts...')

            // Terminating EC2 instances
            for (const host of this.hosts) {
                promises.push(host.terminate())
            }

            await Promise.all(promises)

            promises = []

            Log(0, 'Waiting for hosts to be terminated...')

            // Waiting for EC2 instances to be terminated
            for (const host of this.hosts) {
                promises.push(host.waitFor(State.TERMINATED))
            }

            Log(0, 'All hosts terminated.')

            await Promise.all(promises)

            promises = []

            Log(0, 'Destroying security groups...')
            // Deleting security groups
            for (const securityGroup of this.securityGroups) {
                promises.push(securityGroup.destroy())
            }

            await Promise.all(promises)

            Log(0, 'Network deleted.')

        }

        super.delete()
    }

    async list(): Promise<this[]|undefined> {
        return await super.list(Network) || []
    }

    async build() {
        if (this.isRunning) { abort('This network is already running') }

        /* This method will in fact create Real Security Groups, EC2 instances
        and prepare the instances to have their logs read
        */

        let promises = []
        for (const securityGroup of this.securityGroups) {
            promises.push(securityGroup.create())
        }
        await Promise.all(promises)

        promises = []
        for (const host of this.hosts) {
            promises.push(host.create())
        }
        await Promise.all(promises)

        this.runningSince = new Date()

        this.persist()
    }

    async addHost(host: Host) {
        if (this.hosts.find( (h) => h.$id === host.$id)) {
            abort(`Conflicting host ID`)
        }

        if (!host.$id) {
            host.$id = uid()
        }

        host.networkId = this.$id

        this.hosts.push(host)

        if (this.isRunning) {
            // If the network is already running, newly created hosts will be instantiated right away
            this.synchronizeHosts()
        } else {
            // Otherwise, information will be stored in S3, but nothing will be actually running
        }
        this.persist()
    }

    async addSecurityGroup(securityGroup: SecurityGroup) {
        if (this.securityGroups.find( (sg) => sg.$id === securityGroup.$id)) {
            abort(`Conflicting security group ID`)
        }

        if (!securityGroup.$id) {
            securityGroup.$id = uid()
        }

        securityGroup.networkId = this.$id

        this.securityGroups.push(securityGroup)

        if (this.isRunning) {
            this.synchronizeSecurityGroups()
        }

        this.persist()
    }

    async addDashboard() {
        // Adds a dashboard
        this.persist()
    }

    async addConfigurationFile() {
        // Adds a configuration file
        this.persist()
    }

    async synchronizeHosts() {
        for (const host of this.hosts) {

            await host.transformFromAWS(this)
        }

        this.persist()
    }

    async synchronizeSecurityGroups() {
        for (const securityGroup of this.securityGroups) {
            await securityGroup.transformFromAWS()
        }

        for (const hostSecurityGroup of this.hosts.map( (h) => h.securityGroup)) {
            if (hostSecurityGroup) await hostSecurityGroup.transformFromAWS()
        }
    }
}
