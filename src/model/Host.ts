import {
    $,
    info,
    sleep,
    abort,
    Log,
    Model,
    getUser,
    ResponseSerialize,
    ValidationRequired,
    ValidationMaxLength,
} from '@/simpli'
import { Region } from '@/enum/Region'
import { State } from '@/enum/State'
import { Size } from '@/enum/Size'
import User from '@/model/User'
import _ from 'lodash'
import SecurityGroup from '@/model/SecurityGroup'
import Application from '@/model/Application'
import { S3Wrapper } from '@/app/S3Wrapper'
import AwsGlobal from '@/model/AwsGlobal'
import { EC2, S3, SSM, IAM, CloudWatchLogs as CWL } from 'aws-sdk'
import Initializer from '@/app/Initializer'
import { Zone } from '@/enum/Zone'
import NetworkOld from './NetworkOld'
import Network from './Network'
import { uid } from '@/simpli'

const RSA = require('node-rsa')

export default class Host {

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

    $id: string | null = null
    networkId: string | null = null
    instanceId: string | null = null
    name: string | null = null
    state: State | null = null
    cpuUsage: number | null = null
    ramUsage: number | null = null
    size: Size | null = null
    region: Region | null = null
    availabilityZone: Zone | null = null

    imageId: string | null = null

    @ResponseSerialize(SecurityGroup)
    securityGroup: SecurityGroup | null = null

    @ResponseSerialize(Application)
    applications: Application[] = []

    initialScript: string | null =
    'echo test'
+   'echo test2'

    get userData() {
      return btoa(`#!/bin/bash\n${this.initialScript}`)
    }

    private ec2 = new EC2()

    async transformFromAWS(network: Network) {

        const { switchRegion } = AwsGlobal

        if (!this.region) { abort(`Missing region information`) }
        if (!this.instanceId) { abort(`Missing ID information`) }

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
                            .filter( (t) => t.Key && t.Key === 'Id')
                            .map( (t) =>  t.Value)[0]
                            || assign('\$id', this.$id)

                        // Instance ID
                        this.instanceId = instance.InstanceId || assign('instanceId', this.instanceId)

                        this.networkId = instance.Tags && instance.Tags
                            .filter( (t) => t.Key && t.Key === 'idNetwork')
                            .map( (t) =>  t.Value)[0]
                            || assign('networkId', this.networkId)

                        this.name = instance.Tags && instance.Tags
                            .filter( (t) => t.Key && t.Key === 'Name')
                            .map( (t) =>  t.Value)[0]
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
                            ) ,
                        ) || assign('securityGroup', this.securityGroup)

                        this.applications = this.applications // Tem como checar? Acho que nao

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
        if (!this.region) { abort(`Missing region information`) }

        if (!this.$id) {
            this.$id = uid()
        }

        // Synchronize SG
        if (this.securityGroup) {
            await this.securityGroup.transformFromAWS()
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

        info('log.node.runInstances')
        const data = await this.ec2.runInstances(payload).promise()

        if (data.Instances && data.Instances[0]) this.instanceId = data.Instances[0].InstanceId || null

        if (this.instanceId) {
            info('log.node.attachInstanceProfile')
            await this.attachInstanceProfile()
            info('log.node.instanceCreated')
        }

    }

    async terminate() {
        this.switchRegion()

        if (!this.instanceId) { abort (`Missing ID information`)}

        await this.ec2.terminateInstances({
            InstanceIds: [
                this.instanceId!,
            ],
        }).promise()

    }

    async waitFor(state: State) {
        if (!this.instanceId) { abort(`Missing instance ID information.`) }

        this.switchRegion()

        switch (state) {

            case State.TERMINATED:

                await this.ec2.waitFor('instanceTerminated', {
                    InstanceIds: [this.instanceId!],
                }).promise()

                break

            default:
                return
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
        info('log.node.waitFor')
        await this.ec2.waitFor('instanceRunning', waitPayload).promise()
        info('log.node.instanceRunning')

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
