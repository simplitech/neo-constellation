import { $, getUser } from '@/simpli'
import AwsGlobal from '@/model/AwsGlobal'
import { EC2 } from 'aws-sdk'

const RSA = require('node-rsa')

export default abstract class Initializer {

    static readonly DEFAULT_INSTANCE_PROFILE_NAME = 'neonode-ssm-role'
    static readonly DEFAULT_POLICY_ARN = 'arn:aws:iam::aws:policy/service-role/AmazonEC2RoleforSSM'
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

    static async init() {
        // Initializes bucket
        await this.initBucket()

        // Initializes key pairs
        await this.initS3KeyPair()
        const regions = await AwsGlobal.regions()

        const promises = []
        for (const region of regions) {
            $.snotify.info($.t('log.host.importKeyPair', [region]))
            AwsGlobal.switchRegion(region)
            promises.push(this.initEC2KeyPair(new EC2()))
        }
        await Promise.all(promises)

        // Initializes role
        await this.initRole()

        // Initializes instance profile
        await this.initInstanceProfile()
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

    private static async initEC2KeyPair(ec2: EC2) {
        try {

            const privateKey = (await AwsGlobal.s3.getObject({
                Key: `${Initializer.DEFAULT_KEY_NAME}.pem`,
                Bucket: getUser().bucketName,
            }).promise()).Body

            const publicKey = new RSA(privateKey).exportKey('public').slice(27, -25)

            await ec2.importKeyPair({
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
                PolicyArn: Initializer.DEFAULT_POLICY_ARN,
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
}
