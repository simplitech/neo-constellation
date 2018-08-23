import {$, Model, isLogged, accessKeyId} from '@/simpli'
import {EC2, S3} from 'aws-sdk'
import {DescribeInstancesResult, Reservation, Tag} from 'aws-sdk/clients/ec2'
import IAM from 'aws-sdk/clients/iam'
// import { NOMEM } from 'dns'

const RSA = require('node-rsa')
const shortid = require('shortid')

/* *** AWS EC2 Instance *** */
export default class Node extends Model {

  static readonly DEFAULT_REGION = 'sa-east-1'
  static readonly DEFAULT_KEY_NAME = 'NeoNode'
  static readonly DEFAULT_DEVICE_NAME = '/dev/sda1'
  static readonly DEFAULT_INSTANCE_TYPE = 't2.micro'
  static readonly DEFAULT_RESOURCE_TYPE = 'instance'
  static readonly DEFAULT_NETWORK_TAG = 'idNetwork'
  static readonly DEFAULT_INSTANCE_PROFILE_NAME = 'neonode-ssm-role'
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

  static async list(idNetwork?: string): Promise<Node[]> {
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

    const request = await new EC2().describeInstances(payload).promise()
    const data = request.$response.data as DescribeInstancesResult

    // Serialize response into Node list
    if (data.Reservations) {
      const nodes: Node[] = []

      data.Reservations.forEach((item: Reservation) => {
        const instance = item.Instances && item.Instances[0]

        if (instance) {
          const tag = (instance.Tags || [] as Tag[]).find((tag: Tag) => tag.Key === Node.DEFAULT_NETWORK_TAG)

          const node = new Node()

          if (tag) node.idNetwork = tag.Value as string
          node.idInstance = instance.InstanceId || null
          node.idImage = instance.ImageId || null
          node.keyPair = instance.KeyName || null

          // TODO: replace to Regex match (/network-\n*-sg/g)
          if (instance.SecurityGroups && instance.SecurityGroups[0]) {
            node.idSecurityGroup = instance.SecurityGroups[0].GroupName || null
          }

          nodes.push(node)
        }
      })

      return nodes
    }

    return []
  }

  // Unique ID
  idNetwork: string = shortid.generate()

  // Image ID
  idImage: string | null = null

  // Security Group ID
  idSecurityGroup: string | null = null

  // Instance ID
  idInstance: string | null = null

  ec2: EC2 = new EC2()

  region: string = Node.DEFAULT_REGION

  keyPair: string | null = null

  instanceProfile: string | null = null

  get groupName() {
    return `network-${this.idNetwork}-sg`
  }

  constructor(network?: string, region?: string) {
    super()

    // Auth required
    if (!isLogged()) throw new Error($.t('system.error.unauthorized'))

    if (network) this.idNetwork = network
    if (region) this.region = region
  }

  async create(runOnCreate = false) {
    const {idNetwork, groupName} = this

    if (!idNetwork) throw new Error($.t('system.error.fieldNotDefined'))

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

    if (runOnCreate) await this.run()
  }

  async run() {
    const {idNetwork, idSecurityGroup, idImage, ec2, keyPair} = this

    if (!idNetwork) throw new Error($.t('system.error.fieldNotDefined'))
    if (!idSecurityGroup) throw new Error($.t('system.error.fieldNotDefined'))
    if (!idImage) throw new Error($.t('system.error.fieldNotDefined'))
    if (!keyPair) throw new Error($.t('system.error.fieldNotDefined'))

    const payload = {
      BlockDeviceMappings: [
        {
          DeviceName: Node.DEFAULT_DEVICE_NAME,
          Ebs: {
            DeleteOnTermination: true,
          },
        },
      ],
      ImageId: idImage,
      InstanceType: Node.DEFAULT_INSTANCE_TYPE,
      KeyName: keyPair,
      SecurityGroupIds: [idSecurityGroup],
      MinCount: 1,
      MaxCount: 1,
      TagSpecifications: [
        {
          ResourceType: Node.DEFAULT_RESOURCE_TYPE,
          Tags: [
            {
              Key: Node.DEFAULT_NETWORK_TAG,
              Value: idNetwork,
            },
          ],
        },
      ],
    }

    console.log('Running Instances...')
    const data = await ec2.runInstances(payload).promise()

    if (data.Instances && data.Instances[0]) this.idInstance = data.Instances[0].InstanceId || null

    if (this.idInstance && this.instanceProfile) {
      console.log('Attaching Instance Profile...')
      const status = await this.attachInstanceProfile(this.idInstance, this.instanceProfile)
      console.log(`Status: ${status || 'null'}`)
    }

  }

  async populateIdImage() {
    const {ec2} = this

    const payload = {
      Filters: [
        {
          Name: 'name',
          Values: ['ubuntu-xenial-16.04-amd64-server-dotnetcore-2018.03.27'],
        },
      ],
    }

    console.log('Listing OS Images...')
    const data = await ec2.describeImages(payload).promise()

    if (data.Images && data.Images[0]) this.idImage = data.Images[0].ImageId || null
  }

  async getSecurityGroupByName(name: string) {
    const {ec2} = this

    const payload = {
      Filters: [
        {
          Name: 'group-name',
          Values: [name],
        },
      ],
    }

    console.log('Listing Security Groups...')
    const data = await ec2.describeSecurityGroups(payload).promise()

    if (data.SecurityGroups && data.SecurityGroups[0]) return data.SecurityGroups[0].GroupId

    return null
  }

  async getKeyPair(name: string) {
    const {ec2} = this

    const payload = {
      Filters: [
        {
          Name: 'key-name',
          Values: [name],
        },
      ],
    }

    console.log('Listing Key Pairs...')
    const data = await ec2.describeKeyPairs(payload).promise()

    if (data.KeyPairs && data.KeyPairs[0]) return data.KeyPairs[0].KeyName

    return null
  }

  async getDefaultVpc() {
    const {ec2} = this

    const payload = {
      Filters: [
        {
          Name: 'isDefault',
          Values: ['true'],
        },
      ],
    }

    console.log('Listing VPCs...')
    const data = await ec2.describeVpcs(payload).promise()

    if (data.Vpcs && data.Vpcs[0]) return data.Vpcs[0].VpcId
  }

  async createSecurityGroup(name: string) {
    const {ec2} = this

    const vpcId = await this.getDefaultVpc()

    const payload = {
      GroupName: name,
      Description: name,
      VpcId: vpcId,
    }

    console.log('Creating a Security Group...')
    const data = await ec2.createSecurityGroup(payload).promise()

    return data.GroupId || null
  }

  async createKeyPair(name: string) {
    const {ec2} = this

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

    const iam = new IAM()
    const data = await iam.getInstanceProfile(payload).promise()

    if (data.InstanceProfile) return data.InstanceProfile.InstanceProfileName
    return null
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
    const {ec2} = this

    const payload = {
      IamInstanceProfile: {
        Name: instanceProfileName,
      },
      InstanceId: idInstance,
    }

    const data = await ec2.associateIamInstanceProfile(payload).promise()
    if (data.IamInstanceProfileAssociation) return data.IamInstanceProfileAssociation.State
    return null
  }
}
