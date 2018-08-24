import {
  $,
  abort,
  Model,
  isLogged,
  accessKeyId,
  ValidationRequired,
  ValidationMaxLength,
} from '@/simpli'

import _ from 'lodash'
import {EC2, S3, SSM, IAM} from 'aws-sdk'
import {Instance, Reservation, Tag} from 'aws-sdk/clients/ec2'
import {Size} from '@/enum/Size'
import {Region} from '@/enum/Region'
import {Zone} from '@/enum/Zone'
import AwsGlobal from '@/model/AwsGlobal'

const RSA = require('node-rsa')
const shortid = require('shortid')

/* *** AWS EC2 Instance *** */
export default class Node extends Model {

  static readonly DEFAULT_KEY_NAME = 'NeoNode'
  static readonly DEFAULT_DEVICE_NAME = '/dev/sda1'
  static readonly DEFAULT_INSTANCE_TYPE = 't2.micro'
  static readonly DEFAULT_RESOURCE_TYPE = 'instance'
  static readonly DEFAULT_NETWORK_TAG = 'idNetwork'
  static readonly DEFAULT_INSTANCE_PROFILE_NAME = 'neonode-ssm-role'
  static readonly DEFAULT_POLICY_ARN = 'arn:aws:iam::aws:policy/service-role/AmazonEC2RoleforSSM'
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
      ],
    }

    if (idNetwork) {
      payload = {
        Filters: [
          {
            Name: `tag:${Node.DEFAULT_NETWORK_TAG}`,
            Values: [idNetwork],
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
    for (const resp of responses) {
      if (resp.Reservations) {
        const nodes: Node[] = []

        // Scan all instances of a region
        for (const reservation of resp.Reservations) {
          const instance = reservation.Instances && reservation.Instances[0]

          if (instance) {
            const node = new Node()
            node.serialise(instance)
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

  @ValidationRequired()
  @ValidationMaxLength(60)
  name: string | null = null

  @ValidationRequired()
  size: Size | null = null

  @ValidationRequired()
  region: Region | null = null

  @ValidationRequired()
  availabilityZone: Zone | null = null

  // Instance ID
  idInstance: string | null = null

  // Network ID
  idNetwork: string | null = null

  // Image ID
  idImage: string | null = null

  // Security Group ID
  idSecurityGroup: string | null = null

  keyPair: string | null = null

  instanceProfile: string | null = null

  get groupName() {
    return `network-${this.idNetwork}-sg`
  }

  constructor(network = shortid.generate(), region = AwsGlobal.DEFAULT_REGION) {
    super()

    // Auth required
    if (!isLogged()) abort('system.error.unauthorized')

    if (network) this.idNetwork = network
    if (region) this.region = region
  }

  serialise(instance: Instance) {
    const tag = (instance.Tags || [] as Tag[]).find((tag: Tag) => tag.Key === Node.DEFAULT_NETWORK_TAG)

    if (tag) this.idNetwork = tag.Value as string
    this.idInstance = instance.InstanceId || null
    this.idImage = instance.ImageId || null
    this.keyPair = instance.KeyName || null

    // TODO: replace to Regex match (/network-\n*-sg/g)
    if (instance.SecurityGroups && instance.SecurityGroups[0]) {
      this.idSecurityGroup = instance.SecurityGroups[0].GroupName || null
    }
  }

  async create() {
    const {groupName} = this

    await this.populateIdImage()

    // Get or Create
    this.idSecurityGroup =
      await this.getSecurityGroupByName(groupName) ||
      await this.createSecurityGroup(groupName)

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

  async populateIdImage() {

    const payload = {
      Filters: [
        {
          Name: 'name',
          Values: ['ubuntu-bionic-18.04-amd64-server-20180522-dotnetcore-2018.07.11'],
        },
      ],
    }

    console.log('Listing OS Images...')
    const data = await AwsGlobal.ec2.describeImages(payload).promise()

    if (data.Images && data.Images[0]) this.idImage = data.Images[0].ImageId || null
  }

  async getSecurityGroupByName(name: string) {

    const payload = {
      Filters: [
        {
          Name: 'group-name',
          Values: [name],
        },
      ],
    }

    console.log('Listing Security Groups...')
    const data = await AwsGlobal.ec2.describeSecurityGroups(payload).promise()

    if (data.SecurityGroups && data.SecurityGroups[0]) return data.SecurityGroups[0].GroupId

    return null
  }

  async getKeyPair(name: string) {

    const payload = {
      Filters: [
        {
          Name: 'key-name',
          Values: [name],
        },
      ],
    }

    console.log('Listing Key Pairs...')
    const data = await AwsGlobal.ec2.describeKeyPairs(payload).promise()

    if (data.KeyPairs && data.KeyPairs[0]) return data.KeyPairs[0].KeyName

    return null
  }

  async getDefaultVpc() {

    const payload = {
      Filters: [
        {
          Name: 'isDefault',
          Values: ['true'],
        },
      ],
    }

    console.log('Listing VPCs...')
    const data = await AwsGlobal.ec2.describeVpcs(payload).promise()

    if (data.Vpcs && data.Vpcs[0]) return data.Vpcs[0].VpcId
  }

  async createSecurityGroup(name: string) {

    const vpcId = await this.getDefaultVpc()

    const payload = {
      GroupName: name,
      Description: name,
      VpcId: vpcId,
    }

    console.log('Creating a Security Group...')
    const data = await AwsGlobal.ec2.createSecurityGroup(payload).promise()

    return data.GroupId || null
  }

  async createKeyPair(name: string) {
    const {ec2} = AwsGlobal

    const privateKey = await this.getObject(`${name}.pem`, `neo-bucket-${accessKeyId()}`)

    if (privateKey) {
      const publicKey = new RSA(privateKey).exportKey('public').slice(27, -25)

      const importParams = {
        KeyName: name,
        PublicKeyMaterial: publicKey,
      }

      console.log('Importing Key Pair...')
      await ec2.importKeyPair(importParams).promise()
    } else {
      const payload = {
        KeyName: name,
      }

      console.log('Creating a Key Pair...')
      const data = await ec2.createKeyPair(payload).promise()

      await this.createBucket(`neo-bucket-${accessKeyId()}`)

      const body = data.KeyMaterial
      if (body) await this.putObject(`${name}.pem`, body, `neo-bucket-${accessKeyId()}`)
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

      console.log('Getting Bucket in S3...')
      const data = await s3.getObject(payload).promise()

      if (data) {
        return data.Body
      }
    } catch (error) {
      if (error.code === 'NoSuchBucket' || error.code === 'NoSuchKey') return
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

    console.log('Puting Bucket into S3...')
    return await s3.putObject(payload).promise()
  }

  async createBucket(bucket: string) {
    const payload = {
      Bucket: bucket,
    }

    const s3 = new S3()

    console.log('Creating Bucket into S3...')
    return await s3.createBucket(payload).promise()
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
    console.log('Waiting for instance to be running...')
    await AwsGlobal.ec2.waitFor('instanceRunning', waitPayload).promise()
    console.log('Instance is running! Attaching Instance Profile...')

    const data = await AwsGlobal.ec2.associateIamInstanceProfile(payload).promise()
    console.log(data.IamInstanceProfileAssociation)
    if (data.IamInstanceProfileAssociation) return data.IamInstanceProfileAssociation.State
    return null
  }

  async sendShellScript(idInstance: string) {
    const payload = {
      DocumentName: 'AWS-RunShellScript',
      InstanceIds: [idInstance],
      Parameters: {
        commands : ['yum install -y mysql'],
      },
    }

    const data = await AwsGlobal.ssm.sendCommand(payload).promise()

    if (data.Command && data.Command.Status === 'Success') {
      const commandId = data.Command.CommandId
      const listPayload = {
        CommandId: commandId,
        Details: true,
      }

      const resp = await AwsGlobal.ssm.listCommandInvocations(listPayload).promise()

      console.log(resp)

    }
  }

  private async install() {
    const {idNetwork, idSecurityGroup, idImage, keyPair} = this

    if (!idNetwork) abort('system.error.fieldNotDefined')
    if (!idSecurityGroup) abort('system.error.fieldNotDefined')
    if (!idImage) abort('system.error.fieldNotDefined')
    if (!keyPair) abort('system.error.fieldNotDefined')

    const payload = {
      BlockDeviceMappings: [
        {
          DeviceName: Node.DEFAULT_DEVICE_NAME,
          Ebs: {
            DeleteOnTermination: true,
          },
        },
      ],
      ImageId: idImage!,
      InstanceType: Node.DEFAULT_INSTANCE_TYPE,
      KeyName: keyPair!,
      SecurityGroupIds: [idSecurityGroup!],
      MinCount: 1,
      MaxCount: 1,
      TagSpecifications: [
        {
          ResourceType: Node.DEFAULT_RESOURCE_TYPE,
          Tags: [
            {
              Key: Node.DEFAULT_NETWORK_TAG,
              Value: idNetwork!,
            },
          ],
        },
      ],
    }

    console.log('Running Instances...')
    const data = await AwsGlobal.ec2.runInstances(payload).promise()

    if (data.Instances && data.Instances[0]) this.idInstance = data.Instances[0].InstanceId || null

    if (this.idInstance && this.instanceProfile) {
      console.log('Attaching Instance Profile...')
      await this.attachInstanceProfile(this.idInstance, this.instanceProfile)
      console.log('Instance Created')
    }

  }

}
