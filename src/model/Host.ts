import {
  $,
  info,
  abort,
  Log,
  ResponseSerialize,
} from '@/simpli'
import {Region} from '@/enum/Region'
import {State} from '@/enum/State'
import {Size} from '@/enum/Size'
import SecurityGroup from '@/model/SecurityGroup'
import Application from '@/model/Application'
import AwsGlobal from '@/model/AwsGlobal'
import {EC2} from 'aws-sdk'
import Initializer from '@/app/Initializer'
import {Zone} from '@/enum/Zone'
import Network from './Network'
import {uid} from '@/simpli'

export default class Host {

  get userData() {
    return btoa(`#!/bin/bash\n${this.initialScript}`)
  }

  static readonly MAX_ATTEMPTS = 10
  static readonly DEFAULT_DEVICE_NAME = '/dev/xdva'
  static readonly DEFAULT_DEVICE_SNAPSHOT_ID = 'snap-05d1e6c7ad7b5f068'
  static readonly DEFAULT_RESOURCE_TYPE = 'instance'
  static readonly DEFAULT_AMI_NAME = 'amzn-ami-hvm-2018.03.0.20180811-x86_64-gp2'
  static readonly DEFAULT_NETWORK_TAG = 'idNetwork'
  static readonly DEFAULT_INSTANCE_PROFILE_NAME = 'neonode-ssm-role'
  static readonly DEFAULT_POLICY_ARN = 'arn:aws:iam::aws:policy/service-role/AmazonEC2RoleforSSM'
  static readonly DEFAULT_LOG_GROUP = 'command-log'
  static readonly DEFAULT_ASSUME_ROLE_POLICY = {
    Version: '2012-10-17',
    Statement: [
      {
        Action: 'sts:AssumeRole',
        Principal: {
          Service: 'ec2.amazonaws.com',
        },
        Effect: 'Allow',
      },
    ],
  }
  $name: string = 'Host'

  $id: string | null = null
  networkId: string | null = null
  instanceId: string | null = null
  securityGroupId: string | null = null
  name: string | null = null
  state: State | null = null
  cpuUsage: number | null = null
  ramUsage: number | null = null
  size: Size | null = null
  region: Region | null = null
  availabilityZone: Zone | null = null

  ipv4: string | null = null
  publicDns: string | null = null

  imageId: string | null = null

  @ResponseSerialize(SecurityGroup)
  securityGroup: SecurityGroup | null = null

  @ResponseSerialize(Application)
  applications: Application[] = []

  initialScript: string | null =
    'echo test'
    + 'echo test2'

  private ec2 = new EC2()

  async transformFromAWS(network: Network) {

    const {switchRegion} = AwsGlobal

    if (!this.region) {
      abort(`Missing region information`)
    }
    if (!this.instanceId) {
      abort(`Missing ID information`)
    }

    const payload = {
      InstanceIds: [
        this.instanceId!,
      ],
    }

    switchRegion(this.region!)
    try {
      const data = await new EC2().describeInstances(payload).promise()

      if (data.Reservations) {

        // Scan all instances of a region
        for (const reservation of data.Reservations) {
          const instance = reservation.Instances && reservation.Instances[0]

          const assign = (prop: String, value: any) => {
            Log(1, `Host.${prop} empty during sync. Keeping old value...`)
            return value
          }

          if (instance) {

            // ID
            this.$id = instance.Tags && instance.Tags
                .filter((t) => t.Key && t.Key === 'Id')
                .map((t) => t.Value)[0]
              || assign('\$id', this.$id)

            // Instance ID
            this.instanceId = instance.InstanceId || assign('instanceId', this.instanceId)

            this.networkId = instance.Tags && instance.Tags
                .filter((t) => t.Key && t.Key === 'idNetwork')
                .map((t) => t.Value)[0]
              || assign('networkId', this.networkId)

            this.name = instance.Tags && instance.Tags
                .filter((t) => t.Key && t.Key === 'Name')
                .map((t) => t.Value)[0]
              || assign('name', this.name)

            this.state = instance.State && instance.State.Code || assign('state', this.state)

            // TODO: awsHost.cpuUsage

            // TODO: awsHost.ramUsage

            this.size = instance.InstanceType as Size || assign('size', this.size)

            this.region = this.region

            this.availabilityZone = instance.Placement
              && instance.Placement.AvailabilityZone as Zone
              || assign('availabilityZone', this.availabilityZone)

            this.imageId = instance.ImageId || assign('imageId', this.imageId)

            this.securityGroup = network.securityGroups.find((sg) => sg.hasRealSecurityGroup(
              this.region!,
              instance!.SecurityGroups![0].GroupId!,
              ),
            ) || assign('securityGroup', this.securityGroup)

            this.ipv4 = instance.PublicIpAddress || assign('ipv4', this.ipv4)

            this.publicDns = instance.PublicDnsName || assign('publicDns', this.publicDns)

            // this.applications = this.applications // Tem como checar? Acho que nao

            // TODO: replace to Regex match (/network-\n*-sg/g)
            if (instance.SecurityGroups && instance.SecurityGroups[0]) {
              this.securityGroupId = instance.SecurityGroups[0].GroupName
                || assign('securityGroupId', this.securityGroupId)
            }

          } else {
            Log(1, 'Host instance not found in EC2')
          }

        }
      } else {
        Log(1, 'Host instance not found in EC2')
      }

    } catch (e) {
      // TODO: Handle error
      Log(2, e.message)
      throw (e)
    }

  }

  async create() {
    if (!this.region) {
      abort(`Missing region information`)
    }

    if (!this.$id) {
      this.$id = uid()
    }

    /* Fluxo:
    ** 1) Security Group -> Build SG
    ** 2) Key Pair -> Inicializado
    ** 3) Instance Profile -> Inicializado
    ** 4) Run Instance
    */

    if (!this.imageId) {
      this.imageId = await this.getImageId() || null
    }

    // 1)
    const sgParam = this.securityGroup && this.securityGroup.getRealSecurityGroup(this.region!)

    if (!sgParam) {
      abort(`Missing Security Group information`)
    }

    // 4)
    this.switchRegion()

    const payload = {
      ImageId: this.imageId!,
      InstanceType: this.size!,
      KeyName: Initializer.DEFAULT_KEY_NAME,
      SecurityGroupIds: [sgParam!],
      MinCount: 1,
      MaxCount: 1,
      Placement: {
        AvailabilityZone: this.availabilityZone ? this.availabilityZone.toString() : undefined,
      },
      TagSpecifications: [
        {
          ResourceType: Host.DEFAULT_RESOURCE_TYPE,
          Tags: [
            {
              Key: 'Name',
              Value: this.name!,
            },
            {
              Key: Host.DEFAULT_NETWORK_TAG,
              Value: this.networkId!,
            },
            {
              Key: 'SecurityGroupId',
              Value: this.securityGroup && this.securityGroup.$id || '',
            },
            {
              Key: 'Id',
              Value: this.$id,
            },
          ],
        },
      ],
      UserData: this.userData,
    }

    info('log.host.runInstances')
    const data = await this.ec2.runInstances(payload).promise()

    if (data.Instances && data.Instances[0]) this.instanceId = data.Instances[0].InstanceId || null

    if (this.instanceId) {
      info('log.host.attachInstanceProfile')
      await this.attachInstanceProfile()
      info('log.host.instanceCreated')
    }

  }

  /**
   * Turn On a EC2 instance
   * @returns {Promise<void>}
   */
  async turnOn() {
    this.switchRegion()
    const {ec2, instanceId} = this

    if (!instanceId) abort('system.error.fieldNotDefined')

    const payload = {
      InstanceIds: [instanceId!],
    }

    $.snotify.info(instanceId, $.t('log.host.startInstances'))
    this.state = State.PENDING

    const fetch = async () => {
      await ec2.startInstances(payload).promise()
      await this.manageState()
    }

    await $.await.run(fetch, `host_${this.$id}`)
  }

  /**
   * Turn Off a EC2 instance
   * @returns {Promise<void>}
   */
  async turnOff() {
    this.switchRegion()
    const {ec2, instanceId} = this

    if (!instanceId) abort('system.error.fieldNotDefined')

    const payload = {
      InstanceIds: [instanceId!],
    }

    $.snotify.info(instanceId, $.t('log.host.stopInstances'))
    this.state = State.STOPPING

    const fetch = async () => {
      await ec2.stopInstances(payload).promise()
      await this.manageState()
    }

    await $.await.run(fetch, `host_${this.$id}`)
  }

  /**
   * Terminate a EC2 instance
   * @returns {Promise<void>}
   */
  async terminate() {
    this.switchRegion()
    const {ec2, instanceId} = this

    if (!instanceId) abort('system.error.fieldNotDefined')

    const payload = {
      InstanceIds: [instanceId!],
    }

    $.snotify.info(instanceId, $.t('log.host.terminateInstances'))
    this.state = State.SHUTTING_DOWN

    const fetch = async () => {
      await ec2.terminateInstances(payload).promise()
      await this.manageState()
    }

    await $.await.run(fetch, `host_${this.$id}`)
  }

  async manageState() {
    this.switchRegion()
    const {ec2, instanceId, state} = this

    if (!instanceId) abort('system.error.fieldNotDefined')

    const payload = {
      Filters: [
        {
          Name: 'instance-id',
          Values: [instanceId!],
        },
      ],
    }

    if (state === null || state === State.PENDING) {
      await ec2.waitFor('instanceRunning', payload).promise()

      $.snotify.info(instanceId, $.t('log.host.startedInstances'))

      this.state = State.RUNNING
    } else if (state === State.STOPPING) {
      await ec2.waitFor('instanceStopped', payload).promise()

      $.snotify.info(instanceId, $.t('log.host.stoppedInstances'))

      this.state = State.STOPPED
    } else if (state === State.SHUTTING_DOWN) {
      await ec2.waitFor('instanceTerminated', payload).promise()

      $.snotify.info(instanceId, $.t('log.host.terminatedInstances'))

      this.state = State.TERMINATED
    }
  }

  async waitFor(state: State) {
    if (!this.instanceId) {
      abort(`Missing instance ID information.`)
    }

    this.switchRegion()
    try {
      // Checks if instance exists first, otherwise will be stuck in the 'waitFor' for 10 minutes
      const data = await this.ec2.describeInstances({
        InstanceIds: [
          this.instanceId!,
        ],
      }).promise()

      if (!data ||
        !data.Reservations ||
        !data.Reservations[0] ||
        !data.Reservations[0].Instances ||
        !data.Reservations[0].Instances![0]
      ) {
        return
      }

      switch (state) {

        case State.TERMINATED:

          await this.ec2.waitFor('instanceTerminated', {
            InstanceIds: [this.instanceId!],
          }).promise()

          break

        default:
          return
      }
    } catch (e) {
      Log(2, e.message)
    }
  }

  private async getImageId(imageName?: string) {
    this.switchRegion()

    const payload = {
      Filters: [
        {
          Name: 'name',
          Values: [imageName || Host.DEFAULT_AMI_NAME],
        },
      ],
    }

    const data = await this.ec2.describeImages(payload).promise()

    if (data.Images && data.Images[0] && data.Images[0].ImageId) return data.Images[0].ImageId
    return null
  }

  private async attachInstanceProfile() {
    this.switchRegion()

    const payload = {
      IamInstanceProfile: {
        Name: Initializer.DEFAULT_INSTANCE_PROFILE_NAME,
      },
      InstanceId: this.instanceId!,
    }

    const waitPayload = {
      Filters: [
        {
          Name: 'instance-id',
          Values: [this.instanceId!],
        },
      ],
    }

    // Newly created instances start on a 'pending' status.
    // Must wait for 'running'
    info('log.host.waitFor')
    await this.ec2.waitFor('instanceRunning', waitPayload).promise()
    info('log.host.instanceRunning')

    const data = await this.ec2.associateIamInstanceProfile(payload).promise()
    if (!data || !data.IamInstanceProfileAssociation) {
      throw new Error('Instance Profile not attached.')
    }
  }

  // Utility
  private switchRegion() {
    if (this.region) AwsGlobal.switchRegion(this.region)
    this.ec2 = new EC2()
  }

}
