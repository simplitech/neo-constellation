import { $, getUser, Log, Severity } from '@/simpli'
import AwsGlobal from '@/model/AwsGlobal'
import { EC2, SSM } from 'aws-sdk'
import {Region} from '@/enum/Region'

const RSA = require('node-rsa')

export default abstract class Initializer {

    static readonly DEFAULT_INSTANCE_PROFILE_NAME = 'neonode-ssm-role'
    static readonly DEFAULT_EC2_ROLE_SSM_ARN = 'arn:aws:iam::aws:policy/service-role/AmazonEC2RoleforSSM'
    static readonly DEFAULT_CWA_ROLE_SSM_ARN = 'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy'
    static readonly DEFAULT_KEY_NAME = 'NeoKey'
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
    static readonly DEFAULT_PARAMETER_NAME = 'AmazonCloudWatch-linux'
    static readonly DEFAULT_PARAMETER_TYPE = 'String'
    static readonly DEFAULT_PARAMETER_VALUE = {
      metrics: {
        append_dimensions: {
          AutoScalingGroupName: '${aws:AutoScalingGroupName}',
          ImageId: '${aws:ImageId}',
          InstanceId: '${aws:InstanceId}',
          InstanceType: '${aws:InstanceType}',
        },
        metrics_collected: {
          collectd: {
            metrics_aggregation_interval: 0,
          },
          cpu: {
            measurement: [
              'cpu_usage_idle',
              'cpu_usage_iowait',
              'cpu_usage_user',
              'cpu_usage_system',
            ],
            metrics_collection_interval: 10,
            totalcpu: false,
          },
          disk: {
            measurement: [
              'used_percent',
              'inodes_free',
            ],
            metrics_collection_interval: 10,
            resources: [
              '*',
            ],
          },
          diskio: {
            measurement: [
              'io_time',
            ],
            metrics_collection_interval: 10,
            resources: [
              '*',
            ],
          },
          mem: {
            measurement: [
              'mem_used_percent',
            ],
            metrics_collection_interval: 10,
          },
          statsd: {
            metrics_aggregation_interval: 0,
            metrics_collection_interval: 10,
            service_address: ':8125',
          },
          swap: {
            measurement: [
              'swap_used_percent',
            ],
            metrics_collection_interval: 10,
          },
        },
      },
    }

    static async init() {
        // Region list
        const regions = await AwsGlobal.regions()

        // Initializes bucket
        await this.initBucket()

        // Initializes key pairs
        await this.initS3KeyPair()

        let promises = []
        for (const region of regions) {
            $.snotify.info($.t('log.host.importKeyPair', [region]))
            promises.push(this.initEC2KeyPair(region))
        }
        await Promise.all(promises)

        // Initializes role
        await this.initRole()

        // Initializes instance profile
        await this.initInstanceProfile()

        // Initializes parameter store
        promises = []
        for (const region of regions) {
            promises.push(this.initParameterStore(region))
        }
    }

    private static async initBucket() {
        try {
            await AwsGlobal.s3.createBucket({
                Bucket: getUser().bucketName,
            }).promise()

            await AwsGlobal.s3.waitFor('bucketExists', {
                Bucket: getUser().bucketName,
            }).promise()

        } catch (e) {
            if (e.code === 'BucketAlreadyExists'
            || e.code === 'BucketAlreadyOwnedByYou'
            || e.code === 'IllegalLocationConstraintException') return
            throw (e)
        }
    }

    private static async initS3KeyPair() {
        try {
            // Tries to fetch the private key from S3
            await AwsGlobal.s3.headObject({
                Key: `${Initializer.DEFAULT_KEY_NAME}.pem`,
                Bucket: getUser().bucketName,
            }).promise()

            return

        } catch (e) {
            // If private key material is not in S3, creates a new key in the default region
            // and stores that information in S3
            if (e.code === 'NoSuchKey' || e.code === 'NotFound') {

              await AwsGlobal.ec2.deleteKeyPair({
                KeyName: Initializer.DEFAULT_KEY_NAME,
              }).promise()

              const data = await AwsGlobal.ec2.createKeyPair({
                  KeyName: Initializer.DEFAULT_KEY_NAME,
              }).promise()

              await AwsGlobal.s3.putObject({
                    Body: data.KeyMaterial,
                    Key: `${Initializer.DEFAULT_KEY_NAME}.pem`,
                    Bucket: getUser().bucketName,
                }).promise()

              await AwsGlobal.s3.waitFor('objectExists', {
                    Key: `${Initializer.DEFAULT_KEY_NAME}.pem`,
                    Bucket: getUser().bucketName,
                }).promise()

            }

            throw (e)
        }
    }

    private static async initEC2KeyPair(region: Region) {
        try {

            const privateKey = (await AwsGlobal.s3.getObject({
                Key: `${Initializer.DEFAULT_KEY_NAME}.pem`,
                Bucket: getUser().bucketName,
            }).promise()).Body

            const publicKey = new RSA(privateKey).exportKey('public').slice(27, -25)

            await new EC2({region}).importKeyPair({
                KeyName: Initializer.DEFAULT_KEY_NAME,
                PublicKeyMaterial: publicKey,
            }).promise()

        } catch (e) {
            if (e.code === 'InvalidKeyPair.Duplicate') return
            throw (e)
        }
    }

    private static async initRole() {

        try {
            await AwsGlobal.iam.createRole({
                AssumeRolePolicyDocument: JSON.stringify(Initializer.DEFAULT_ASSUME_ROLE_POLICY),
                RoleName: Initializer.DEFAULT_INSTANCE_PROFILE_NAME,
            }).promise()

        } catch (e) {
            if (e.code !== 'EntityAlreadyExists') {
                throw (e)
            }
        }

        try {
            await AwsGlobal.iam.attachRolePolicy({
                RoleName: Initializer.DEFAULT_INSTANCE_PROFILE_NAME,
                PolicyArn: Initializer.DEFAULT_EC2_ROLE_SSM_ARN,
            }).promise()

        } catch (e) {
            if (e.code !== 'EntityAlreadyExists') {
                throw (e)
            }
        }

        try {
          await AwsGlobal.iam.attachRolePolicy({
              RoleName: Initializer.DEFAULT_INSTANCE_PROFILE_NAME,
              PolicyArn: Initializer.DEFAULT_CWA_ROLE_SSM_ARN,
          }).promise()

      } catch (e) {
          if (e.code !== 'EntityAlreadyExists') {
              throw (e)
          }
      }

    }

    private static async initInstanceProfile() {
        try {
            await AwsGlobal.iam.createInstanceProfile({
                InstanceProfileName: Initializer.DEFAULT_INSTANCE_PROFILE_NAME,
            }).promise()

            await AwsGlobal.iam.addRoleToInstanceProfile({
                RoleName: Initializer.DEFAULT_INSTANCE_PROFILE_NAME,
                InstanceProfileName: Initializer.DEFAULT_INSTANCE_PROFILE_NAME,
            }).promise()
        } catch (e) {
            if (e.code === 'EntityAlreadyExists') return
            throw (e)
        }

    }

    private static async initParameterStore(region: Region) {
      try {
        const resp = await new SSM({region}).putParameter({
          Name: Initializer.DEFAULT_PARAMETER_NAME,
          Type: Initializer.DEFAULT_PARAMETER_TYPE,
          Value: JSON.stringify(Initializer.DEFAULT_PARAMETER_VALUE),
          Overwrite: true,
        }).promise()

        Log(Severity.INFO, resp)
      } catch (e) {
        Log(Severity.ERROR, `Error on creating parameter store: ${e}'.`)
        throw (e)
      }
    }
}
