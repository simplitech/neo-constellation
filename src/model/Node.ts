import {$, Model, isLogged, accessKeyId} from '@/simpli'
import {config, EC2, S3} from 'aws-sdk'

const RSA = require('node-rsa')
const shortid = require('shortid')

/* *** AWS EC2 Instance *** */
export default class Node extends Model {

  static readonly DEFAULT_REGION = 'sa-east-1'
  static readonly DEFAULT_KEY_NAME = 'NeoNode'
  static readonly DEFAULT_DEVICE_NAME = '/dev/sda1'
  static readonly DEFAULT_INSTANCE_TYPE = 't2.micro'
  static readonly DEFAULT_RESOURCE_TYPE = 'instance'
  static readonly DEFAULT_ID_FIELD = 'uid'

  // Unique ID
  uid: string | null = null

  // Image ID
  idImage: string | null = null

  // Security Group ID
  idSecurityGroup: string | null = null

  // Instance ID
  idInstance: string | null = null

  ec2: EC2 = new EC2()

  region: string | null = null

  keyPair: string | null = null

  get groupName() {
    return `network-${this.uid}-sg`
  }

  constructor(region: string = Node.DEFAULT_REGION) {
    super()

    // Auth required
    if (!isLogged()) throw new Error($.t('system.error.unauthorized'))

    this.uid = shortid.generate()
    this.region = region
  }

  async create(runOnCreate = false) {
    const {uid, region, groupName} = this

    if (region) config.update({region})

    if (!uid) throw new Error($.t('system.error.fieldNotDefined'))

    await this.populateIdImage()

    // Get or Create
    this.idSecurityGroup =
      await this.getSecurityGroupByName(groupName) ||
      await this.createSecurityGroup(groupName)

    // Get or Create
    this.keyPair =
      await this.getKeyPair(Node.DEFAULT_KEY_NAME) ||
      await this.createKeyPair(Node.DEFAULT_KEY_NAME)

    if (runOnCreate) await this.run()
  }

  async run() {
    const {uid, idSecurityGroup, idImage, ec2, keyPair} = this

    if (!uid) throw new Error($.t('system.error.fieldNotDefined'))
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
              Key: Node.DEFAULT_ID_FIELD,
              Value: uid,
            },
          ],
        },
      ],
    }

    console.log('Running Instances...')
    const data = await ec2.runInstances(payload).promise()

    if (data.Instances && data.Instances[0]) this.idInstance = data.Instances[0].InstanceId || null
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

}
