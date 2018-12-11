import {
  $,
  info,
  sleep,
  abort,
  Model,
  getUser,
  ValidationRequired,
  ValidationMaxLength,
} from '@/simpli'

import _ from 'lodash'
import {EC2, S3, SSM, IAM, CloudWatchLogs as CWL} from 'aws-sdk'
import {Instance, Reservation, Tag} from 'aws-sdk/clients/ec2'
import {OutputLogEvent} from 'aws-sdk/clients/cloudwatchlogs'
import {Size} from '@/enum/Size'
import {Region} from '@/enum/Region'
import {Zone} from '@/enum/Zone'
import {State} from '@/enum/State'
import {Stream} from '@/enum/Stream'
import AwsGlobal from '@/model/AwsGlobal'
import Network from '@/model/Network'
import Container from '@/model/Container'
import StreamEvent from '@/model/StreamEvent'
import { Command } from 'aws-sdk/clients/ssm'

const RSA = require('node-rsa')
const shortid = require('shortid')

/* *** AWS EC2 Instance *** */
export default class Node extends Model {

  static readonly MAX_ATTEMPTS = 10
  static readonly DEFAULT_KEY_NAME = 'NeoNode'
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

  static bucketName() {
    // return _.lowerCase(accessKeyId()).replace(/ /g, '')
    return ''
  }

  /**
   * List all nodes based on filter
   * @param {string} idNetwork
   * @param {Region} region
   * @returns {Promise<Node[]>}
   */
  static async list(idNetwork?: string, region?: Region) {
    const {regions, switchRegion} = AwsGlobal

    let payload = {
      Filters: [
        {
          Name: `tag:${Node.DEFAULT_NETWORK_TAG}`,
          Values: ['*'],
        },
        {
          Name: 'instance-state-code',
          Values: ['0', '16', '32', '64', '80'],
        },
      ],
    }

    if (idNetwork) {
      payload = {
        Filters: [
          {
            Name: `tag:${Node.DEFAULT_NETWORK_TAG}`,
            Values: [idNetwork],
          },
          {
            Name: 'instance-state-code',
            Values: ['0', '16', '32', '64', '80'],
          },
        ],
      }
    }

    // List of promises
    const promises = []

    const listRegion = region ? [region] : await regions()
    // Scan all AWS regions
    for (const region of listRegion) {
      switchRegion(region)
      promises.push(new EC2().describeInstances(payload).promise())
    }

    // List of nodes of each region
    const list: Node[][] = []

    // Scan all responses
    const responses = await Promise.all(promises)
    for (const [index, resp] of responses.entries()) {
      if (resp.Reservations) {
        const nodes: Node[] = []

        // Scan all instances of a region
        for (const reservation of resp.Reservations) {
          const instance = reservation.Instances && reservation.Instances[0]

          if (instance) {
            const node = new Node()
            node.region = listRegion[index]
            node.get(instance)
            nodes.push(node)
          }
        }

        list.push(nodes)
      }
    }

    return _.chain(list)
      .flatten()
      .uniqBy('idInstance')
      .value() as Node[]
  }

  get $id() {
    return this.idInstance
  }

  set $id(val: string | null) {
    this.idInstance = val
  }

  // Instance ID
  idInstance: string | null = null

  // Network ID
  idNetwork: string | null = null

  // Image ID
  idImage: string | null = null

  // Security Group ID
  idSecurityGroup: string | null = null

  @ValidationRequired()
  @ValidationMaxLength(60)
  name: string | null = null

  @ValidationRequired()
  size: Size | null = null

  @ValidationRequired()
  region: Region | null = null

  availabilityZone: Zone | null = null

  state: State | null = null

  keyPair: string | null = null

  instanceProfile: string | null = null

  ipv4: string | null = null

  publicDns: string | null = null

  containers: Container[] = []

  initialScript: string | null =
  'sudo yum -y install docker\n'
+ 'sudo service docker start\n'
+ 'sudo docker run --rm -d --name neo-privatenet '
+ '-p 20333-20336:20333-20336/tcp '
+ '-p 30333-30336:30333-30336/tcp cityofzion/neo-privatenet'

  get userData() {
    return btoa(`#!/bin/bash\n${this.initialScript}`)
  }

  get groupName() {
    return `network-${this.idNetwork}-sg`
  }

  private ec2: EC2 = new EC2()

  /**
   * Node constructor
   * @param {Region} region
   */
  constructor(region = AwsGlobal.DEFAULT_REGION) {
    super()
    if (region) this.region = region
  }

  switchRegion() {
    if (this.region) AwsGlobal.switchRegion(this.region)
    this.ec2 = new EC2()
  }

  /**
   * Gets the equivalent node of an EC2 instance
   * @param {EC2.Instance} instance
   */
  get(instance: Instance) {
    const tags = instance.Tags

    let nameTag: Tag | undefined
    let idNetworkTag: Tag | undefined

    if (tags) {
      nameTag = tags.find((tag: Tag) => tag.Key === 'Name')
      idNetworkTag = tags.find((tag: Tag) => tag.Key === Node.DEFAULT_NETWORK_TAG)
    }

    if (nameTag) this.name = nameTag.Value as string
    if (idNetworkTag) this.idNetwork = idNetworkTag.Value as string
    this.idInstance = instance.InstanceId || null
    this.idImage = instance.ImageId || null
    this.size = instance.InstanceType as Size || null
    this.state = instance.State && instance.State.Code || null
    this.keyPair = instance.KeyName || null
    this.ipv4 = instance.PublicIpAddress || null
    this.publicDns = instance.PublicDnsName || null

    // TODO: replace to Regex match (/network-\n*-sg/g)
    if (instance.SecurityGroups && instance.SecurityGroups[0]) {
      this.idSecurityGroup = instance.SecurityGroups[0].GroupName || null
    }

    this.populateContainers()
  }

  /**
   * Creates a new EC2 instance
   * @returns {Promise<void>}
   */
  async create() {

    if (!this.idNetwork) this.idNetwork = shortid.generate()
    const {groupName} = this

    await this.populateIdImage()

    // Get or Create
    this.idSecurityGroup = await this.getSecurityGroupByName(groupName)
    if (!this.idSecurityGroup) {
      this.idSecurityGroup = await this.createSecurityGroup(groupName)
      await this.setDefaultGroupRules()
    }

    // Get or Create
    this.keyPair =
      await this.getKeyPair(Node.DEFAULT_KEY_NAME) ||
      await this.createKeyPair(Node.DEFAULT_KEY_NAME)

    // Get or Create
    this.instanceProfile =
      await this.getInstanceProfile(Node.DEFAULT_INSTANCE_PROFILE_NAME) ||
      await this.createInstanceProfile(Node.DEFAULT_INSTANCE_PROFILE_NAME)

    await this.install()
  }

  /**
   * Turn On a EC2 instance
   * @returns {Promise<void>}
   */
  async turnOn() {
    this.switchRegion()
    const {ec2, idInstance} = this

    if (!idInstance) abort('system.error.fieldNotDefined')

    const payload = {
      InstanceIds: [idInstance!],
    }

    $.snotify.info(idInstance, $.t('log.node.startInstances'))
    this.state = State.PENDING

    const fetch = async () => {
      await ec2.startInstances(payload).promise()
      await this.manageState()
    }

    await $.await.run(fetch, `node_${this.$id}`)
  }

  /**
   * Turn Off a EC2 instance
   * @returns {Promise<void>}
   */
  async turnOff() {
    this.switchRegion()
    const {ec2, idInstance} = this

    if (!idInstance) abort('system.error.fieldNotDefined')

    const payload = {
      InstanceIds: [idInstance!],
    }

    $.snotify.info(idInstance, $.t('log.node.stopInstances'))
    this.state = State.STOPPING

    const fetch = async () => {
      await ec2.stopInstances(payload).promise()
      await this.manageState()
    }

    await $.await.run(fetch, `node_${this.$id}`)
  }

  /**
   * Terminate a EC2 instance
   * @returns {Promise<void>}
   */
  async terminate() {
    this.switchRegion()
    const {ec2, idInstance} = this

    if (!idInstance) abort('system.error.fieldNotDefined')

    const payload = {
      InstanceIds: [idInstance!],
    }

    $.snotify.info(idInstance, $.t('log.node.terminateInstances'))
    this.state = State.SHUTTING_DOWN

    // async check network and destroy (without await)?
    this.deleteNetworkIfEmpty()

    const fetch = async () => {
      await ec2.terminateInstances(payload).promise()
      await this.manageState()
    }

    await $.await.run(fetch, `node_${this.$id}`)
  }

  async deleteNetworkIfEmpty() {

    const {ec2, idInstance, idNetwork} = this
    if (!idInstance) abort('system.error.fieldNotDefined')
    if (!idNetwork) abort('system.error.fieldNotDefined')

    // async check network and destroy
    const payload = {
      Filters: [
        {
          Name: 'instance-id',
          Values: [idInstance!],
        },
      ],
    }

    await ec2.waitFor('instanceTerminated', payload).promise()

    const network = new Network()
    await network.get(idNetwork!)

    if (!network.nodes || network.nodes.length <= 0) {
      await network.destroy()
    }
  }

  async manageState() {
    this.switchRegion()
    const {ec2, idInstance, state} = this

    if (!idInstance) abort('system.error.fieldNotDefined')

    const payload = {
      Filters: [
        {
          Name: 'instance-id',
          Values: [idInstance!],
        },
      ],
    }

    if (state === null || state === State.PENDING) {
      await ec2.waitFor('instanceRunning', payload).promise()

      $.snotify.info(idInstance, $.t('log.node.startedInstances'))

      this.state = State.RUNNING
    } else if (state === State.STOPPING) {
      await ec2.waitFor('instanceStopped', payload).promise()

      $.snotify.info(idInstance, $.t('log.node.stoppedInstances'))

      this.state = State.STOPPED
    } else if (state === State.SHUTTING_DOWN) {
      await ec2.waitFor('instanceTerminated', payload).promise()

      $.snotify.info(idInstance, $.t('log.node.terminatedInstances'))

      this.state = State.TERMINATED
    }
  }

  async populateIdImage() {
    this.switchRegion()

    const payload = {
      Filters: [
        {
          Name: 'name',
          Values: [Node.DEFAULT_AMI_NAME],
        },
      ],
    }

    info('log.node.describeImages')
    const data = await this.ec2.describeImages(payload).promise()

    if (data.Images && data.Images[0]) this.idImage = data.Images[0].ImageId || null
  }

  async getSecurityGroupByName(name: string) {
    this.switchRegion()

    const payload = {
      Filters: [
        {
          Name: 'group-name',
          Values: [name],
        },
      ],
    }

    info('log.node.describeSecurityGroups')
    const data = await this.ec2.describeSecurityGroups(payload).promise()

    if (data.SecurityGroups && data.SecurityGroups[0]) return data.SecurityGroups[0].GroupId || null

    return null
  }

  async getKeyPair(name: string) {
    this.switchRegion()

    const payload = {
      Filters: [
        {
          Name: 'key-name',
          Values: [name],
        },
      ],
    }

    info('log.node.describeKeyPairs')
    const data = await this.ec2.describeKeyPairs(payload).promise()

    if (data.KeyPairs && data.KeyPairs[0]) return data.KeyPairs[0].KeyName

    return null
  }

  async getDefaultVpc() {
    this.switchRegion()

    const payload = {
      Filters: [
        {
          Name: 'isDefault',
          Values: ['true'],
        },
      ],
    }

    info('log.node.describeVpcs')
    const data = await this.ec2.describeVpcs(payload).promise()

    if (data.Vpcs && data.Vpcs[0]) return data.Vpcs[0].VpcId
  }

  async createSecurityGroup(name: string) {
    const vpcId = await this.getDefaultVpc()

    const payload = {
      GroupName: name,
      Description: name,
      VpcId: vpcId,
    }

    info('log.node.createSecurityGroup')
    const data = await this.ec2.createSecurityGroup(payload).promise()

    return data.GroupId || null
  }

  async createKeyPair(name: string) {
    this.switchRegion()

    const privateKey = await this.getObject(`${name}.pem`, Node.bucketName())

    if (privateKey) {
      const publicKey = new RSA(privateKey).exportKey('public').slice(27, -25)

      const importParams = {
        KeyName: name,
        PublicKeyMaterial: publicKey,
      }

      info('log.node.importKeyPair')
      await this.ec2.importKeyPair(importParams).promise()
    } else {
      const payload = {
        KeyName: name,
      }

      info('log.node.createKeyPair')
      const data = await this.ec2.createKeyPair(payload).promise()

      await this.createBucket(Node.bucketName())

      const body = data.KeyMaterial
      if (body) await this.putObject(`${name}.pem`, body, Node.bucketName())
    }

    return name
  }

  async getObject(key: string, bucket: string) {
    try {
      const payload = {
        Key: key,
        Bucket: bucket,
      }

      const s3 = new S3()

      info('log.node.getObject')
      const data = await s3.getObject(payload).promise()

      if (data) {
        return data.Body
      }
    } catch (error) {
      if (error.code === 'NoSuchBucket' || error.code === 'NoSuchKey') return
      console.log(error)
      throw error
    }
  }

  async putObject(key: string, body: string, bucket: string) {
    const payload = {
      Key: key,
      Body: body,
      Bucket: bucket,
    }

    const s3 = new S3()

    info('log.node.putObject')
    return await s3.putObject(payload).promise()
  }

  async createBucket(bucket: string) {
    const payload = {
      Bucket: bucket,
    }

    const s3 = new S3()

    info('log.node.createBucket')
    try {
      const data = await s3.createBucket(payload).promise()
      return data
    } catch (e) {
      console.log(e)
    }
  }

  async getInstanceProfile(name: string) {
    const payload = {
      InstanceProfileName: name,
    }

    try {
      const iam = new IAM()
      const data = await iam.getInstanceProfile(payload).promise()

      if (data.InstanceProfile) return data.InstanceProfile.InstanceProfileName

    } catch (e) {
      if (e.code === 'NoSuchEntity') return
      throw e
    }
  }

  async createInstanceProfile(name: string) {
    const payload = {
      InstanceProfileName: name,
    }
    let instanceProfileName = null

    // Get or Create
    const roleName =
      await this.getRole(name) ||
      await this.createRole(name)

    const iam = new IAM()
    const data = await iam.createInstanceProfile(payload).promise()

    if (data.InstanceProfile) {
      instanceProfileName = data.InstanceProfile.InstanceProfileName
    }

    if (roleName && instanceProfileName) {
      await this.addRoleToInstanceProfile(roleName, instanceProfileName)
    }

    return instanceProfileName
  }

  async getRole(name: string) {
    try {
      const payload = {
        RoleName: name,
      }

      const iam = new IAM()
      const data = await iam.getRole(payload).promise()

      if (data.Role) return data.Role.RoleName

      return null

    } catch (error) {
      if (error.code === 'NoSuchEntity') return null
      throw error
    }
  }

  async createRole(name: string) {
    const payload = {
      AssumeRolePolicyDocument: JSON.stringify(Node.DEFAULT_ASSUME_ROLE_POLICY),
      RoleName: name,
    }

    const iam = new IAM()
    const data = await iam.createRole(payload).promise()

    if (data.Role) return data.Role.RoleName
    return null
  }

  async addRoleToInstanceProfile(roleName: string, instanceProfileName: string) {
    const payload = {
      RoleName: roleName,
      InstanceProfileName: instanceProfileName,
    }

    const iam = new IAM()
    return await iam.addRoleToInstanceProfile(payload).promise()
  }

  async attachInstanceProfile(idInstance: string, instanceProfileName: string) {
    this.switchRegion()

    const payload = {
      IamInstanceProfile: {
        Name: instanceProfileName,
      },
      InstanceId: idInstance,
    }

    const waitPayload = {
      Filters: [
        {
          Name: 'instance-id',
          Values: [idInstance],
        },
      ],
    }

    // Newly created instances start on a 'pending' status.
    // Must wait for 'running'
    info('log.node.waitFor')
    await this.ec2.waitFor('instanceRunning', waitPayload).promise()
    info('log.node.instanceRunning')

    const data = await this.ec2.associateIamInstanceProfile(payload).promise()
    if (data.IamInstanceProfileAssociation) return data.IamInstanceProfileAssociation.State
    return null
  }

  async populateContainers() {
    const payload = 'docker ps --format \"'
    + '{{.ID}},'
    + '{{.Image}},'
    + '{{.Command}},'
    + '{{.CreatedAt}},'
    + '{{.RunningFor}},'
    + '{{.Ports}},'
    + '{{.Status}},'
    + '{{.Size}},'
    + '{{.Names}},'
    + '{{.Labels}},'
    + '{{.Mounts}},'
    + '{{.Networks}}'
    + '\"'

    const command = await this.sendCommand([payload], true)

    if (!command) return

    await this.waitForCommand(command)
    const log = await this.getCommandRawOutput(command)

    if (!log) return

    for (const output of log.split('\n')) {
      if (!Container.validate(output)) {
        break
      }

      const container = new Container()
      container.get(output)
      this.containers.push(container)
    }

  }

  async sendCommand(commands: string[], silent?: boolean) {

    const {region, idInstance} = this
    if (!region) abort('system.error.fieldNotDefined')
    if (!idInstance) abort('system.error.fieldNotDefined')

    const payload = {
      DocumentName: 'AWS-RunShellScript',
      Comment: silent ? 'silent' : '',
      CloudWatchOutputConfig: {
        CloudWatchLogGroupName: 'command-log',
        CloudWatchOutputEnabled: !silent,
      },
      InstanceIds: [idInstance!],
      Parameters: {
        commands,
      },
    }

    AwsGlobal.switchRegion(region!)

    const ssm = new SSM()

    const data = await ssm.sendCommand(payload).promise()

    if (data && data.Command) {
      return data.Command
    }
  }

  async listCommands() {

    const {region, idInstance} = this
    if (!region) abort('system.error.fieldNotDefined')
    if (!idInstance) abort('system.error.fieldNotDefined')

    this.switchRegion()

    const payload = {
      InstanceId: idInstance!,
    }

    AwsGlobal.switchRegion(region!)

    const ssm = new SSM()

    const data = await ssm.listCommands(payload).promise()
    return data.Commands && data.Commands.filter((c) => c.Comment !== 'silent')

  }

  async getCommandOutputStream(command: Command) {

    const {region, idInstance} = this
    if (!region) abort('system.error.fieldNotDefined')
    if (!idInstance) abort('system.error.fieldNotDefined')
    if (!command.CommandId) abort('system.error.fieldNotDefined')

    const outData = this.getStreamLog(command, Stream.OUT)
    const errData = this.getStreamLog(command, Stream.ERR)

    const values = await Promise.all([outData, errData])

    const stdout = values[0] || []
    const stderr = values[1] || []

    const log = stdout.concat(stderr).sort((a, b) => a.timestamp! - b.timestamp!)

    return log as StreamEvent[]
  }

  async getCommandRawOutput(command: Command) {
    const {region, idInstance} = this
    if (!region) abort('system.error.fieldNotDefined')
    if (!idInstance) abort('system.error.fieldNotDefined')
    if (!command.CommandId) abort('system.error.fieldNotDefined')

    AwsGlobal.switchRegion(region!)
    const ssm = new SSM()

    const payload = {
      CommandId: command.CommandId!,
      Details: true,
    }

    const data = await ssm.listCommandInvocations(payload).promise()

    if (data &&
      data.CommandInvocations &&
      data.CommandInvocations[0] &&
      data.CommandInvocations[0].CommandPlugins &&
      data.CommandInvocations[0].CommandPlugins![0]) {
        return data.CommandInvocations[0].CommandPlugins![0].Output
      }

  }

  async waitForCommand(command: Command) {
    const {region, idInstance} = this
    if (!region) abort('system.error.fieldNotDefined')
    if (!command.CommandId) abort('system.error.fieldNotDefined')
    if (!idInstance) abort('system.error.fieldNotDefined')

    const payload = {
      CommandId: command.CommandId!,
      InstanceId: idInstance!,
    }

    let request = command

    AwsGlobal.switchRegion(region!)
    const ssm = new SSM()

    // Waits for command status
    let attempts = 0
    while (request.Status &&
      request.Status === 'Pending' ||
      request.Status === 'In Progress' ||
      request.Status === 'Delayed') {

      attempts++

      if (attempts > Node.MAX_ATTEMPTS ) {
        abort('system.error.timeOut')
      }

      request = await ssm.listCommands(payload).promise()
      await sleep(1000)
    }

  }

  async setSecurityGroupInboundRule(protocol: string, port: {from: number, to: number} | number) {
    this.switchRegion()

    const {idSecurityGroup} = this

    if (!idSecurityGroup) abort('system.error.fieldNotDefined')
    if (protocol !== 'tcp' && 'udp') abort('system.error.invalidProtocol')

    if (typeof port === 'number') {
      port = {from: port, to: port}
    }

    const payload = {
      GroupId: idSecurityGroup!,
      IpPermissions: [
        {
          FromPort: port.from,
          IpProtocol: protocol,
          IpRanges: [
            {
            CidrIp: '0.0.0.0/0',
            },
          ],
          ToPort: port.to,
        },
      ],
    }

    const data = await this.ec2.authorizeSecurityGroupIngress(payload).promise()

  }

  private async setDefaultGroupRules() {
    info('log.node.setSecurityGroupRules')
    await this.setSecurityGroupInboundRule('tcp', 22)
    await this.setSecurityGroupInboundRule('tcp', 443)
    await this.setSecurityGroupInboundRule('tcp', 80)
    await this.setSecurityGroupInboundRule('tcp', {from: 20333, to: 20336})
    await this.setSecurityGroupInboundRule('tcp', {from: 30333, to: 30336})
  }

  private async install() {
    this.switchRegion()

    const {name, idNetwork, idSecurityGroup, idImage, availabilityZone, size, keyPair, userData} = this

    if (!name) abort('system.error.fieldNotDefined')
    if (!idNetwork) abort('system.error.fieldNotDefined')
    if (!idSecurityGroup) abort('system.error.fieldNotDefined')
    if (!idImage) abort('system.error.fieldNotDefined')
    if (!size) abort('system.error.fieldNotDefined')
    if (!keyPair) abort('system.error.fieldNotDefined')

    const payload = {
      ImageId: idImage!,
      InstanceType: size!,
      KeyName: keyPair!,
      SecurityGroupIds: [idSecurityGroup!],
      MinCount: 1,
      MaxCount: 1,
      Placement: {
        AvailabilityZone: availabilityZone ? availabilityZone.toString() : undefined,
      },
      TagSpecifications: [
        {
          ResourceType: Node.DEFAULT_RESOURCE_TYPE,
          Tags: [
            {
              Key: 'Name',
              Value: name!,
            },
            {
              Key: Node.DEFAULT_NETWORK_TAG,
              Value: idNetwork!,
            },
          ],
        },
      ],
      UserData: userData,
    }

    info('log.node.runInstances')
    const data = await this.ec2.runInstances(payload).promise()

    if (data.Instances && data.Instances[0]) this.idInstance = data.Instances[0].InstanceId || null

    if (this.idInstance && this.instanceProfile) {
      info('log.node.attachInstanceProfile')
      await this.attachInstanceProfile(this.idInstance, this.instanceProfile)
      info('log.node.instanceCreated')
    }
  }

  private async getStreamLog(command: Command, stream: Stream) {
    const { idInstance, region } = this
    if (!idInstance) abort('system.error.fieldNotDefined')
    if (!region) abort('system.error.fieldNotDefined')
    if (!command.CommandId) abort('system.error.fieldNotDefined')

    const streamLog: StreamEvent[] = []
    let streamPath: string = ''

    switch (stream) {
      case Stream.OUT:
        streamPath = `${command.CommandId}/${idInstance!}/aws-runShellScript/stdout`
        break
      case Stream.ERR:
        streamPath = `${command.CommandId}/${idInstance!}/aws-runShellScript/stderr`
        break
    }

    const payload = {
      logGroupName: Node.DEFAULT_LOG_GROUP, /* required */
      logStreamName: streamPath, /* required */
      startFromHead: true,
    }
    try {
      AwsGlobal.switchRegion(region!)
      const cwl = new CWL()

      const data = await cwl.getLogEvents(payload).promise()

      if (data && data.events) {

        for (const rawEvent of data.events) {
          const formattedEvent = new StreamEvent()

          formattedEvent.timestamp = rawEvent.timestamp!
          formattedEvent.message = (rawEvent.message as string).split(/(?:\n|\r)/g)
          formattedEvent.stream = stream

          streamLog.push(formattedEvent)
        }
      }
    } catch (error) {
      if (error.code !== 'ResourceNotFoundException') throw error
    }

    return streamLog as StreamEvent[]
  }
}
