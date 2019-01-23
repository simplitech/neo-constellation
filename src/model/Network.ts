import {
  $,
  uid,
  abort,
  ResponseSerialize,
  ValidationRequired,
  syncNetworks,
} from '@/simpli'
import Host from '@/model/Host'
import SecurityGroup from '@/model/SecurityGroup'
import Dashboard from '@/model/Dashboard'
import ConfigurationFile from '@/model/ConfigurationFile'
import {S3Wrapper} from '@/app/S3Wrapper'
import {State} from '@/enum/State'
import {Log} from '@/helpers/logger.helper'

export default class Network extends S3Wrapper {
  $name: string = 'Network'

  $id: string | null = null

  @ValidationRequired()
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

  get isRunning(): boolean {
    return !!this.runningSince
  }

  async get(id: String) {
    const network = await super.get(id)

    if (this.isRunning) {
      await network.synchronizeSecurityGroups()
      await network.synchronizeHosts()

      await this.persist()
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

      await Promise.all(promises)

      Log(0, 'All hosts terminated.')

      promises = []

      Log(0, 'Destroying security groups...')
      // Deleting security groups
      for (const securityGroup of this.securityGroups) {
        promises.push(securityGroup.destroy())
      }

      await Promise.all(promises)

      Log(0, 'Network deleted.')

    }

    await super.delete()
  }

  async list(): Promise<this[] | undefined> {
    const fetch = async () => await super.list(Network) || []
    return $.await.run(fetch, 'listNetwork')
  }

  async persist(): Promise<void> {
    await super.persist()
    // syncNetworks()
  }

  async build() {
    if (this.isRunning) {
      abort('This network is already running')
    }

    /* This method will in fact create Real Security Groups, EC2 instances
    and prepare the instances to have their logs read
    */

    let promises = []
    for (const securityGroup of this.securityGroups) {
      promises.push(securityGroup.create())
    }
    await Promise.all(promises)

    await this.synchronizeSecurityGroups()

    promises = []
    for (const host of this.hosts) {
      promises.push(host.create())
    }
    await Promise.all(promises)

    await this.synchronizeHosts()

    this.runningSince = new Date()

    await this.persist()
  }

  async addHost(host: Host) {
    if (this.hosts.find((h) => h.$id === host.$id)) {
      abort(`Conflicting host ID`)
    }

    if (!host.$id) {
      host.$id = uid()
    }

    host.networkId = this.$id

    this.hosts.push(host)

    if (this.isRunning) {
      // If the network is already running, newly created hosts will be instantiated right away
      await host.create()
      await this.synchronizeHosts()
    } else {
      // Otherwise, information will be stored in S3, but nothing will be actually running
    }
    await this.persist()
  }

  async addSecurityGroup(securityGroup: SecurityGroup) {
    if (this.securityGroups.find((sg) => sg.$id === securityGroup.$id)) {
      abort(`Conflicting security group ID`)
    }

    if (!securityGroup.$id) {
      securityGroup.$id = uid()
    }

    securityGroup.networkId = this.$id

    this.securityGroups.push(securityGroup)

    if (this.isRunning) {
      await securityGroup.create()
      await this.synchronizeSecurityGroups()
    }

    await this.persist()
  }

  async addDashboard() {
    // Adds a dashboard
    await this.persist()
  }

  async addConfigurationFile() {
    // Adds a configuration file
    await this.persist()
  }

  async synchronizeHosts() {
    for (const host of this.hosts) {
      await host.transformFromAWS(this)
    }
  }

  async synchronizeSecurityGroups() {
    for (const securityGroup of this.securityGroups) {
      await securityGroup.transformFromAWS()
    }

    for (const hostSecurityGroup of this.hosts.map((h) => h.securityGroup)) {
      if (hostSecurityGroup) await hostSecurityGroup.transformFromAWS()
    }
  }
}
