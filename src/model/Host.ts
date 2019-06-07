import {
  $,
  info,
  Model,
  Log,
  ResponseSerialize,
  ValidationRequired,
  abort,
  sleep,
} from '@/simpli'
import { Region } from '@/enum/Region'
import { State } from '@/enum/State'
import { Size } from '@/enum/Size'
import SecurityGroup from '@/model/SecurityGroup'
import Application from '@/model/Application'
import { CloudWatch as CW, CloudWatchLogs as CWL, EC2, SSM } from 'aws-sdk'
import Initializer from '@/app/Initializer'
import { Zone } from '@/enum/Zone'
import { Stream } from '@/enum/Stream'
import Network from './Network'
import { uid } from '@/simpli'
import Exception from './Exception'
import { ErrorCode } from '@/enum/ErrorCode'
import { Severity } from '@/helpers/logger.helper'
import { Command } from 'aws-sdk/clients/ssm'
import StreamEvent from './StreamEvent'

export default class Host extends Model {

  get userData() {
    return btoa(`#!/bin/bash\n${Host.DEFAULT_INIT_SCRIPT + this.initialScript}`)
  }

  static readonly MAX_ATTEMPTS = 10
  static readonly DEFAULT_DEVICE_NAME = '/dev/xdva'
  static readonly DEFAULT_DEVICE_SNAPSHOT_ID = 'snap-05d1e6c7ad7b5f068'
  static readonly DEFAULT_RESOURCE_TYPE = 'instance'
  static readonly DEFAULT_AMI_NAME = 'amzn-ami-hvm-2018.03.0.20180811-x86_64-gp2'
  static readonly DEFAULT_NETWORK_TAG = 'idNetwork'
  static readonly DEFAULT_LOG_GROUP = 'command-log'
  // TODO: Change init script according to OS
  static readonly DEFAULT_INIT_SCRIPT = 'sudo yum -y update && sudo yum -y install collectd\n'
  $name: string = 'Host'

  $id: string | null = null
  networkId: string | null = null
  instanceId: string | null = null

  @ValidationRequired()
  name: string | null = null

  state: State | null = null
  cpuUsage: number | null = null
  ramUsage: number | null = null

  @ValidationRequired()
  size: Size | null = null

  @ValidationRequired()
  region: Region | null = null

  availabilityZone: Zone | null = null

  ipv4: string | null = null
  publicDns: string | null = null

  imageId: string | null = null

  @ValidationRequired()
  @ResponseSerialize(SecurityGroup)
  securityGroup: SecurityGroup | null = null

  @ResponseSerialize(Application)
  applications: Application[] = []

  initialScript: string | null =
    'echo test\n'
  + 'echo test2'

  processing = false

  /**
   * Populates the current object with information from the actual EC2 instance
   * running on AWS (synchronizes).
   * @param network This host's network (required for security groups)
   */
  async transformFromAWS(network: Network) {

    if (!this.region || !this.instanceId) {
      throw new Exception(ErrorCode.ON_SYNCHRONIZE_HOST, this.$id, 'Missing region or ID information')
    }

    const payload = {
      InstanceIds: [
        this.instanceId!,
      ],
    }

    try {
      const data = await new EC2({region: this.region}).describeInstances(payload).promise()

      if (
        data.Reservations &&
        data.Reservations.length &&
        data.Reservations![0] &&
        data.Reservations![0].Instances &&
        data.Reservations![0].Instances!.length &&
        data.Reservations![0].Instances![0]
        ) {

        const instance = data.Reservations![0].Instances![0]

        // Function to keep old value and log
        const assign = (prop: String, value: any) => {
          Log(1, `Host.${prop} empty during sync. Keeping old value...`)
          return value
        }

        // ID
        this.$id = instance.Tags && instance.Tags
          .filter((t) => t.Key && t.Key === 'Id')
          .map((t) => t.Value)[0]
          || assign('\$id', this.$id)

        // Instance ID
        this.instanceId = instance.InstanceId || assign('instanceId', this.instanceId)

        // Network ID
        this.networkId = instance.Tags && instance.Tags
          .filter((t) => t.Key && t.Key === 'idNetwork')
          .map((t) => t.Value)[0]
          || assign('networkId', this.networkId)

        // Name
        this.name = instance.Tags && instance.Tags
          .filter((t) => t.Key && t.Key === 'Name')
          .map((t) => t.Value)[0]
          || assign('name', this.name)

        // State
        this.state = instance.State && instance.State.Code || assign('state', this.state)

        // CPU Usage
        this.cpuUsage = await this.getCpuUsage()

        // TODO: awsHost.ramUsage
        this.ramUsage = await this.getMemUsage()

        // Size
        this.size = instance.InstanceType as Size || assign('size', this.size)

        // Region
        // this.region = this.region

        // Availability Zone
        this.availabilityZone = instance.Placement
          && instance.Placement.AvailabilityZone as Zone
          || assign('availabilityZone', this.availabilityZone)

        // Image ID (AMI)
        this.imageId = instance.ImageId || assign('imageId', this.imageId)

        // Security Group
        this.securityGroup = network.securityGroups.find((sg) => sg.hasRealSecurityGroup(
          this.region!,
          instance!.SecurityGroups![0].GroupId!,
        ),
        ) || assign('securityGroup', this.securityGroup)

        // IPV4
        this.ipv4 = instance.PublicIpAddress || assign('ipv4', this.ipv4)

        // Public DNS
        this.publicDns = instance.PublicDnsName || assign('publicDns', this.publicDns)

        // Applications (not sure how to check this)
        // this.applications = this.applications

      } else {
        throw new Exception(ErrorCode.ON_SYNCHRONIZE_HOST, this.$id, 'Host not found in EC2.')
      }
    } catch (e) {
      throw new Exception(ErrorCode.ON_SYNCHRONIZE_HOST, this.$id, e.message)
    }
  }

  /**
   * Creates and turns on an EC2 instance on AWS with this host object information
   * @return {Promise<void>}
   */
  async create() {
    try {
      await this.createInstance()
      Log(Severity.INFO, `EC2 instance for host '${this.$id}' created on region '${this.region}'.`)

    } catch (e) {
      throw new Exception(ErrorCode.ON_CREATE_HOST, this.$id, e.message)
    }

    try {

      await this.attachInstanceProfile()
      Log(Severity.INFO, `Instance Profile attatched to '${this.$id}' corresponding EC2 instance.`)

    } catch (e) {
      throw new Exception(ErrorCode.ON_ATTACH_INSTANCE_PROFILE, this.$id, e.message)
    }

    try {
      await this.installCloudWatchAgentPackage()
      Log(Severity.INFO, `CloudWatch agent package installed on '${this.$id}' corresponding EC2 instance.`)
    } catch (e) {
      // TODO: Treat CWA error for different types of OS
      // throw new Exception(ErrorCode.ON_INSTALL_CWA_PACKAGE, this.$id, e.message)
      Log(Severity.WARN, `CloudWatch agent package not installed on '${this.$id}' corresponding EC2 instance.`)
    }

    try {
      await this.startCloudWatchAgent()
      Log(Severity.INFO, `CloudWatch agent package started on '${this.$id}' corresponding EC2 instance.`)
    } catch (e) {
      // TODO: Treat CWA error for different types of OS
      // throw new Exception(ErrorCode.ON_START_CWA_PACKAGE, this.$id, e.message)
      Log(Severity.WARN, `CloudWatch agent package not started on '${this.$id}' corresponding EC2 instance.`)
    }

  }
  /**
   * Signals the state change to the corresponding EC2 instance for this host
   * @return {Promise<void>}
   */
  async changeState(state: State.RUNNING | State.STOPPED | State.TERMINATED) {
    try {
      switch (state) {
        case State.RUNNING:
          await this.turnOn()
          break
        case State.STOPPED:
          await this.turnOff()
          break
        case State.TERMINATED:
          await this.terminate()
          break
      }
    } catch (e) {
      let message: String

      if (e instanceof Exception) {
        message = `Code ${e.errorCode}: ${e.message}`
      } else {
        message = e.message
      }

      Log(Severity.WARN, message)
    }
  }

  /**
   * Turns on the corresponding EC2 instance for this host
   * @return {Promise<void>}
   */
  async turnOn() {

    if (!this.instanceId) {
      throw new Exception(ErrorCode.ON_CHANGE_HOST_STATE, this.$id, 'Instance not running.')
    }

    $.snotify.info(this.instanceId, $.t('log.host.startInstances'))
    this.state = State.PENDING

    const fetch = async () => {
      if (!this.region) {
        throw new Exception(ErrorCode.ON_CHANGE_HOST_STATE, this.$id, 'Instance not running.')
      }

      await new EC2({region: this.region}).startInstances({
        InstanceIds: [this.instanceId!],
      }).promise()

      await this.manageState()
    }

    await $.await.run(fetch, `host_${this.$id}`)
  }

  /**
   * Turns off the corresponding EC2 instance for this host
   * @return {Promise<void>}
   */
  async turnOff() {

    if (!this.instanceId) {
      throw new Exception(ErrorCode.ON_CHANGE_HOST_STATE, this.$id, 'Instance not running.')
    }

    $.snotify.info(this.instanceId, $.t('log.host.stopInstances'))
    this.state = State.STOPPING

    const fetch = async () => {
      if (!this.region) {
        throw new Exception(ErrorCode.ON_CHANGE_HOST_STATE, this.$id, 'Instance not running.')
      }

      await new EC2({region: this.region}).stopInstances({
        InstanceIds: [this.instanceId!],
      }).promise()

      await this.manageState()
    }

    await $.await.run(fetch, `host_${this.$id}`)
  }

  /**
   * Terminates the corresponding EC2 instance for this host
   * @return {Promise<void>}
   */
  async terminate() {

    if (!this.instanceId) {
      throw new Exception(ErrorCode.ON_CHANGE_HOST_STATE, this.$id, 'Instance not running.')
    }

    $.snotify.info(this.instanceId, $.t('log.host.terminateInstances'))
    this.state = State.SHUTTING_DOWN

    const fetch = async () => {
      if (!this.region) {
        throw new Exception(ErrorCode.ON_CHANGE_HOST_STATE, this.$id, 'Instance not running.')
      }

      await new EC2({region: this.region}).terminateInstances({
        InstanceIds: [this.instanceId!],
      }).promise()

      await this.manageState()
    }

    await $.await.run(fetch, `host_${this.$id}`)
  }

  /**
   * Manages this host state, waiting for state changes in the corresponding AWS EC2 instance
   * @return {Promise<void>}
   */
  async manageState() {
    const { instanceId, region, state } = this

    if (!instanceId) {
      throw new Exception(ErrorCode.ON_CHANGE_HOST_STATE, this.$id, 'Instance not running.')
    }

    if (!region) {
      throw new Exception(ErrorCode.ON_CHANGE_HOST_STATE, this.$id, 'Instance not running.')
    }

    const payload = {
      InstanceIds: [instanceId!],
    }

    // Checks if the EC2 instance actually exists, or it'll be stuck in the 'waitFor' for 10 minutes

    if (!await this.existsInstance()) {
      return
    }

    const ec2 = new EC2({region})

    if (state === null || state === State.PENDING) {
      $.await.init(`host_${this.$id}`)
      if (this.processing) return
      this.processing = true

      await ec2.waitFor('instanceRunning', payload).promise()
      $.snotify.info(instanceId, $.t('log.host.startedInstances'))
      this.state = State.RUNNING

      this.processing = false
      $.await.done(`host_${this.$id}`)
    } else if (state === State.STOPPING) {
      $.await.init(`host_${this.$id}`)
      if (this.processing) return
      this.processing = true

      await ec2.waitFor('instanceStopped', payload).promise()
      $.snotify.info(instanceId, $.t('log.host.stoppedInstances'))
      this.state = State.STOPPED

      this.processing = false
      $.await.done(`host_${this.$id}`)
    } else if (state === State.SHUTTING_DOWN) {
      $.await.init(`host_${this.$id}`)
      if (this.processing) return
      this.processing = true

      await ec2.waitFor('instanceTerminated', payload).promise()
      $.snotify.info(instanceId, $.t('log.host.terminatedInstances'))
      this.state = State.TERMINATED

      this.processing = false
      $.await.done(`host_${this.$id}`)
    }

  }

  /**
   * Waits for specified EC2 state, to be used for other processes
   * @param state
   * @return {Promise<void>}
   */
  async waitFor(state: State) {
    if (!this.instanceId) {
      return
    }

    try {
      // Checks if instance exists first, otherwise will be stuck in the 'waitFor' for 10 minutes
      if (!await this.existsInstance()) {
        return
      }

      if (!this.region) {
        throw new Exception(ErrorCode.ON_WAIT_FOR, this.$id, 'Region not found.')
      }

      switch (state) {

        case State.TERMINATED:

          await new EC2({region: this.region}).waitFor('instanceTerminated', {
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

  /**
   * Sends a command to the corresponding EC2 instance of this host
   * @param commands list of commands
   * @param silent boolean indicating if command output should be logged
   * @return {Promise<StreamEvent[]} list of StreamEvents from the stdout and stderr
   * of the corresponding commands, or an empty list if commands weren't found
   */
  async sendCommand(commands: string[], silent: boolean = false) {

    if (!this.instanceId) {
      throw new Exception(ErrorCode.ON_SEND_COMMAND, this.$id, 'Instance not running.')
    }

    if (!this.region) {
      throw new Exception(ErrorCode.ON_SEND_COMMAND, this.$id, 'Region not found.')
    }

    const payload = {
      DocumentName: 'AWS-RunShellScript',
      Comment: silent ? 'silent' : '',
      CloudWatchOutputConfig: {
        CloudWatchLogGroupName: 'command-log',
        CloudWatchOutputEnabled: !silent,
      },
      InstanceIds: [this.instanceId],
      Parameters: {
        commands,
      },
    }

    const data = await new SSM({region: this.region}).sendCommand(payload).promise()

    if (data && data.Command) {

      await this.waitForCommand(data.Command)

      return await this.getCommandOutputStream(data.Command)

    }

    return []
  }

  /**
   * Gets the output of the corresponding EC2 Command
   * @param input EC2 Command
   * @return {Promise<StreamEvent[]>} list of StreamEvents from the stdout and stderr
   * of the corresponding commands
   */
  private async getCommandOutputStream(input: Command) {

    if (!this.region) {
      throw new Exception(ErrorCode.ON_SEND_COMMAND, this.$id, 'Region not found.')
    }

    if (!this.instanceId) {
      throw new Exception(ErrorCode.ON_SEND_COMMAND, this.$id, 'Instance not running.')
    }

    if (!input.CommandId) {
      throw new Exception(ErrorCode.ON_SEND_COMMAND, this.$id, 'Instance not running.')
    }

    const outData = this.getStreamLog(input, Stream.OUT)
    const errData = this.getStreamLog(input, Stream.ERR)

    const values = await Promise.all([outData, errData])

    const stdout = values[0] || []
    const stderr = values[1] || []

    const log = stdout.concat(stderr).sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0))

    return log
  }

  /**
   * Gets the output of the corresponding EC2 Command from CloudWatchLogs
   * @param input EC2 Command
   * @param stream enum indicating which stream of events to be read (stdout or stderr)
   * @return {Promise<StreamEvent[]>} list of StreamEvents from the given stream for the given EC2 Command
   */
  private async getStreamLog(input: Command, stream: Stream) {

    if (!this.region) {
      throw new Exception(ErrorCode.ON_SEND_COMMAND, this.$id, 'Region not found.')
    }

    if (!this.instanceId) {
      throw new Exception(ErrorCode.ON_SEND_COMMAND, this.$id, 'Instance not running.')
    }

    if (!input.CommandId) {
      throw new Exception(ErrorCode.ON_SEND_COMMAND, this.$id, 'Instance not running.')
    }

    const streamLog: StreamEvent[] = []
    let streamPath: string = ''

    switch (stream) {
      case Stream.OUT:
        streamPath = `${input.CommandId}/${this.instanceId}/aws-runShellScript/stdout`
        break
      case Stream.ERR:
        streamPath = `${input.CommandId}/${this.instanceId}/aws-runShellScript/stderr`
        break
    }

    const payload = {
      logGroupName: Host.DEFAULT_LOG_GROUP, /* required */
      logStreamName: streamPath, /* required */
      startFromHead: true,
    }

    try {
      const data = await new CWL({region: this.region!}).getLogEvents(payload).promise()

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
      // Ignores ResourceNotFoundException, because if a command doesn't
      // give any output in the given stream (no errors, for example, so stderr is empty),
      // it throws this exception
      if (error.code !== 'ResourceNotFoundException') throw error
    }

    return streamLog
  }

  /**
   * Gets the AWS ID for the given Amazon Machine Image (AMI) name.
   * @param {string | undefined} imageName Name of the Amazon Machine Image (AMI)
   * @return {string | null} AWS ID of the AMI (ami-xxxxxxxxxxxxxxxxx) or null if not found
   */
  private async getImageId(imageName?: string) {

    if (!this.region) {
      throw new Exception(ErrorCode.ON_GET_IMAGE_ID, this.$id, 'Region not found.')
    }

    // If imageName was not provided, uses the default AMI name
    const payload = {
      Filters: [
        {
          Name: 'name',
          Values: [imageName || Host.DEFAULT_AMI_NAME],
        },
      ],
    }

    const data = await new EC2({region: this.region}).describeImages(payload).promise()

    if (data.Images &&
      data.Images[0] &&
      data.Images[0].ImageId
    ) {
      return data.Images[0].ImageId
    }

    return null
  }

  private async createInstance() {
    if (
      !this.region ||
      !this.$id ||
      !this.networkId ||
      !this.securityGroup ||
      !this.securityGroup.$id ||
      !this.size ||
      !this.name
    ) {
      throw new Exception(ErrorCode.ON_CREATE_HOST, this.$id, 'Missing instance information.')
    }

    // If host doesn't have an image ID, gets the default
    if (!this.imageId) {
      this.imageId = await this.getImageId() || null

      // If not even default image ID was found, abort
      if (!this.imageId) { throw new Exception(ErrorCode.ON_CREATE_HOST, this.$id, 'Missing instance information.') }
    }

    // Gets the Security Group AWS ID (GroupID) for this host's region
    const sgParam = this.securityGroup!.getRealSecurityGroup(this.region!)

    if (!sgParam) { throw new Exception(ErrorCode.ON_CREATE_HOST, this.$id, 'Missing instance information.') }

    // Runs the EC2 instance

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
              Value: this.securityGroup!.$id!,
            },
            {
              Key: 'Id',
              Value: this.$id!,
            },
          ],
        },
      ],
      UserData: this.userData,
    }

    info('log.host.runInstances')
    const data = await new EC2({region: this.region}).runInstances(payload).promise()

    if (!data || !data.Instances || !data.Instances.length || !data.Instances[0] || !data.Instances[0].InstanceId) {
      throw new Exception(ErrorCode.ON_CREATE_HOST, this.$id)
    }

    this.instanceId = data.Instances[0].InstanceId!
  }

  /**
   * Attaches an IAM Instance Profile to the corresponding EC2 instance of this host
   * to be used for log reading through SSM
   * @return {Promise<void>}
   */
  private async attachInstanceProfile() {

    if (!this.region) {
      throw new Exception(ErrorCode.ON_ATTACH_INSTANCE_PROFILE, this.$id, 'Region not found.')
    }

    const payload = {
      IamInstanceProfile: {
        Name: Initializer.DEFAULT_INSTANCE_PROFILE_NAME,
      },
      InstanceId: this.instanceId!,
    }

    const waitPayload = {
      InstanceIds: [this.instanceId!],
    }

    const ec2 = new EC2({region: this.region})
    // Newly created instances start on a 'pending' status.
    // Must wait for 'running'
    info('log.host.waitFor')
    await ec2.waitFor('instanceRunning', waitPayload).promise()
    info('log.host.instanceRunning')

    const data = await ec2.associateIamInstanceProfile(payload).promise()

    if (!data || !data.IamInstanceProfileAssociation) {
      throw new Exception(ErrorCode.ON_ATTACH_INSTANCE_PROFILE, this.$id)
    }

  }

  /**
   * Installs the CloudWatch Agent Package in the corresponding EC2 instance of this host
   * through SSM's Run Command functionality for memory usage monitoring
   * @return {Promise<void>}
   */
  private async installCloudWatchAgentPackage() {
    if (!this.instanceId) {
      throw new Exception(ErrorCode.ON_SEND_COMMAND, this.$id, 'Instance not running.')
    }

    if (!this.region) {
      throw new Exception(ErrorCode.ON_SEND_COMMAND, this.$id, 'Region not found.')
    }

    const payload = {
      DocumentName: 'AWS-ConfigureAWSPackage',
      InstanceIds: [this.instanceId],
      Parameters: {
        action: ['Install'],
        name: ['AmazonCloudWatchAgent'],
        version: [''],
      },
    }

    const data = await new SSM({region: this.region}).sendCommand(payload).promise()

    if (data && data.Command) {
      await this.waitForCommand(data.Command)
    }

  }

  /**
   * Starts the CloudWatch Agent in the corresponding EC2 instance of this host
   * through SSM's Run Command functionality for memory usage monitoring
   * @return {Promise<void>}
   */
  private async startCloudWatchAgent() {
    if (!this.instanceId) {
      throw new Exception(ErrorCode.ON_SEND_COMMAND, this.$id, 'Instance not running.')
    }

    if (!this.region) {
      throw new Exception(ErrorCode.ON_SEND_COMMAND, this.$id, 'Region not found.')
    }

    const payload = {
      DocumentName: 'AmazonCloudWatch-ManageAgent',
      InstanceIds: [this.instanceId],
      Parameters: {
        action: ['configure'],
        mode: ['ec2'],
        optionalConfigurationLocation: [Initializer.DEFAULT_PARAMETER_NAME],
        optionalConfigurationSource: ['ssm'],
        optionalRestart: ['yes'],
      },
    }

    const data = await new SSM({region: this.region}).sendCommand(payload).promise()

    if (data && data.Command) {
      await this.waitForCommand(data.Command)
    }
  }

  /**
   * Reads the CPU usage of the corresponding EC2 instance of this host
   * from CloudWatch metrics
   * @return {Promise<number | null>} cpuUsage in percent
   */
  private async getCpuUsage(): Promise<number | null> {
    if (!this.instanceId || !this.region || !this.$id) {
      return null
    }

    const payload = {
      EndTime: this.getEndTime(),
      MetricDataQueries: [
        {
          Id: this.$id,
          MetricStat: {
            Metric: {
              Dimensions: [
                {
                  Name: 'InstanceId',
                  Value: this.instanceId,
                },
              ],
              Namespace: 'AWS/EC2',
              MetricName: 'CPUUtilization',
            },
            Period: 10,
            Stat: 'Average',
            Unit: 'Percent',
          },
        },
      ],
      StartTime: this.getStartTime(),
      ScanBy: 'TimestampDescending',
    }

    try {
      const data = await new CW({region: this.region}).getMetricData(payload).promise()

      if (data
        && data.MetricDataResults
        && data.MetricDataResults[0]
        && data.MetricDataResults[0].Values
        && data.MetricDataResults[0].Values[0]) {
          return data.MetricDataResults[0].Values[0]
      }

    } catch (e) {
      Log(Severity.WARN, `Could not read CPU usage for Host '${this.$id}'`)
    }

    return null

  }

  /**
   * Reads the memory usage of the corresponding EC2 instance of this host
   * from CloudWatch metrics
   * @return {Promise<number | null>} ramUsage in percent
   */
  private async getMemUsage(): Promise<number | null> {
    if (!this.instanceId || !this.region || !this.$id || !this.imageId || !this.size) {
      return null
    }

    const payload = {
      EndTime: this.getEndTime(),
      MetricDataQueries: [
        {
          Id: this.$id,
          MetricStat: {
            Metric: {
              Dimensions: [
                {
                  Name: 'InstanceId',
                  Value: this.instanceId,
                },
                {
                  Name: 'ImageId',
                  Value: this.imageId,
                },
                {
                  Name: 'InstanceType',
                  Value: this.size,
                },
              ],
              Namespace: 'CWAgent',
              MetricName: 'mem_used_percent',
            },
            Period: 10,
            Stat: 'Average',
            Unit: 'Percent',
          },
        },
      ],
      StartTime: this.getStartTime(),
      ScanBy: 'TimestampDescending',
    }

    try {
      const data = await new CW({region: this.region}).getMetricData(payload).promise()

      if (data
        && data.MetricDataResults
        && data.MetricDataResults[0]
        && data.MetricDataResults[0].Values
        && data.MetricDataResults[0].Values[0]) {
          return data.MetricDataResults[0].Values[0]
      }

    } catch (e) {
      Log(Severity.WARN, `Could not read Memory usage for Host '${this.$id}'`)
    }

    return null

  }

  // Utility
  private async existsInstance(): Promise <Boolean> {
    if (!this.instanceId) {
      return false
    }
    if (!this.region) {
      return false
    }

    const data = await new EC2({region: this.region}).describeInstances({
      InstanceIds: [this.instanceId!],
    }).promise()

    return !!(data
      && data.Reservations
      && data.Reservations[0]
      && data.Reservations[0]!.Instances
      && data.Reservations[0]!.Instances![0]
      && data.Reservations[0]!.Instances![0].InstanceId)
  }

  private async waitForCommand(input: Command) {

    if (!this.region) {
      throw new Exception(ErrorCode.ON_SEND_COMMAND, this.$id, 'Region not found.')
    }

    if (!this.instanceId) {
      throw new Exception(ErrorCode.ON_SEND_COMMAND, this.$id, 'Instance not running.')
    }

    if (!input.CommandId) {
      throw new Exception(ErrorCode.ON_SEND_COMMAND, this.$id, 'Instance not running.')
    }

    const payload = {
      CommandId: input.CommandId,
      InstanceId: this.instanceId,
    }

    let command = input

    const ssm = new SSM({region: this.region})

    // Waits for command status
    let attempts = 0

    while (command.Status &&
      command.Status === 'Pending' ||
      command.Status === 'In Progress' ||
      command.Status === 'Delayed') {

      attempts++

      if (attempts > Host.MAX_ATTEMPTS ) {
        abort('system.error.timeOut')
      }

      const data = await ssm.listCommands(payload).promise()

      if (data && data.Commands && data.Commands.length) {
        const respCommand = data.Commands.find( (c) => c.CommandId === command.CommandId)

        if (respCommand) {
          command = respCommand
        }

      }

      await sleep(1000)
    }

  }

  private getEndTime(): Date {
    const date = new Date()
    date.setSeconds(date.getSeconds() - date.getSeconds() % 10, 0)
    return date
  }

  private getStartTime(): Date {
    return new Date(this.getEndTime().valueOf() - 240000)
  }

}
