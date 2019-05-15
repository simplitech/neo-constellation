import {
  $,
  uid,
  ResponseSerialize,
  ValidationRequired,
} from '@/simpli'
import Host from '@/model/Host'
import SecurityGroup from '@/model/SecurityGroup'
import Dashboard from '@/model/Dashboard'
import ConfigurationFile from '@/model/ConfigurationFile'
import { S3Wrapper } from '@/app/S3Wrapper'
import { State } from '@/enum/State'
import { Log, Severity } from '@/helpers/logger.helper'
import Exception from './Exception'
import { ErrorCode } from '@/enum/ErrorCode'
import settle from '@/helpers/settler.helper'

export default class Network extends S3Wrapper {
  $name: string = 'Network'

  $id: string | null = null

  get $tag() {
    if (this.name) {
      return `${this.$id} (${this.name})`
    }
    return this.$id
  }

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

  async persist(): Promise<string> {
    return await super.persist()
    // syncNetworks()
  }

  async build() {
    if (this.isRunning) {
      throw new Exception(ErrorCode.NETWORK_ALREADY_RUNNING, this.$id)
    }

    if (!this.$id) {
      throw new Exception(ErrorCode.ON_CREATE_NETWORK, null, 'Missing ID information (persist?)')
    }

    /* This method will in fact create Real Security Groups, EC2 instances
    and prepare the instances to have their logs read
    */

    try {
      let promises = []

      /* Creates security groups */
      for (const securityGroup of this.securityGroups) {
        promises.push(securityGroup.create())
      }
      await settle(promises)

      /* Synchronizes security groups */
      await this.synchronizeSecurityGroups()

      promises = []

      /* Creates hosts */
      for (const host of this.hosts) {
        promises.push(host.create())
      }
      await settle(promises)

      /* Synchronizes hosts */
      await this.synchronizeHosts()

      /* Sets network as running */
      this.runningSince = new Date()

      /* Persists network */
      await this.persist()

    } catch (e) {
      Log(Severity.ERROR, e)
      if (e instanceof Exception) {
        await this.rollback(e.errorCode)
      } else {
        await this.rollback()
      }
    }
  }

  async addHost(host: Host) {
    if (this.hosts.find((h) => h.$id === host.$id)) {
      throw new Exception(ErrorCode.ON_ADD_HOST, this.$id, 'Conflicting host ID')
    }

    if (!this.$id) {
      throw new Exception(ErrorCode.ON_CREATE_NETWORK, null, 'Missing ID information (persist?)')
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
      throw new Exception(ErrorCode.ON_ADD_SECURITY_GROUP, this.$id, 'Conflicting security group ID')
    }

    if (!this.$id) {
      throw new Exception(ErrorCode.ON_CREATE_NETWORK, null, 'Missing ID information (persist?)')
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
    try {

      const promises = []
      for (const host of this.hosts) {
          promises.push(host.transformFromAWS(this))
      }
      await settle(promises)

    } catch (e) {

      Log(Severity.WARN, e)

    }
  }

  async synchronizeSecurityGroups() {
    try {

      let promises = []
      for (const securityGroup of this.securityGroups) {
          promises.push(securityGroup.transformFromAWS())
      }
      await settle(promises)

      promises = []
      for (const hostSecurityGroup of this.hosts.map((h) => h.securityGroup)) {
        if (hostSecurityGroup) {
          promises.push(hostSecurityGroup.transformFromAWS())
        }
      }
      await settle(promises)

    } catch (e) {

      Log(Severity.WARN, e)

    }
  }

  private async rollback(code?: ErrorCode) {

    let promises = []

    if (!code) {
      code = ErrorCode.UNDEFINED
    }

    switch (code) {
      default:
      case ErrorCode.ON_SYNCHRONIZE_HOST:
      case ErrorCode.ON_ATTACH_INSTANCE_PROFILE:
      case ErrorCode.ON_CREATE_HOST:

      try {
        Log(Severity.WARN, 'Rolling back hosts...')
        // Deleting hosts
        promises = []
        for (const host of this.hosts) {
          promises.push(host.terminate())
        }

        await settle(promises)

      } catch (e) {
        Log(Severity.WARN, e)
      }

      try {
        Log(Severity.WARN, 'Waiting for hosts to be terminated...')
        // Waiting for EC2 instances to be terminated
        promises = []
        for (const host of this.hosts) {
          promises.push(host.waitFor(State.TERMINATED))
        }

        await settle(promises)

      } catch (e) {
        Log(Severity.WARN, e)
      }

      case ErrorCode.ON_SYNCHRONIZE_SECURITY_GROUP:
      case ErrorCode.ON_CREATE_RULE:
      case ErrorCode.ON_CREATE_SECURITY_GROUP:

      try {
        Log(Severity.WARN, 'Rolling back security groups...')
        // Deleting security groups
        promises = []
        for (const securityGroup of this.securityGroups) {
          promises.push(securityGroup.destroy())
        }

        await settle(promises)
      } catch (e) {
        Log(Severity.WARN, e)
      }

    }
    Log(Severity.WARN, 'Rollback finished.')

  }
}
