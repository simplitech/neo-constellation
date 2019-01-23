import { abort, ResponseSerialize, Log } from '@/simpli'
import { EC2 } from 'aws-sdk'
import { Region } from '@/enum/Region'
import AwsGlobal from '@/model/AwsGlobal'
import _ from 'lodash'
import Rule from '@/model/Rule'

export interface RealSecurityGroup {
  [key: string]: string,
}

export default class SecurityGroup {

  $id: string | null = null
  name: string | null = null
  networkId: string | null = null

  realSecurityGroups: RealSecurityGroup[] = []

  @ResponseSerialize(Rule)
  inbound: Rule[] = []

  @ResponseSerialize(Rule)
  outbound: Rule[] = []

  private runningSince: Date | null = null

  hasRealSecurityGroup(region: Region, sgReal: string) {
    return !!this.realSecurityGroups.find((sg) => sg[region] === sgReal)
  }

  /**
   * Gets the AWS GroupID (sg-xxxxxxxx) from the real Security Group corresponding
   * to this (internal) security group's object for the given region
   * or null if not found / network is not running
   * @param {Region} region AWS region
   * @return {string | null} AWS GroupID (sg-xxxxxxxx) or null
   */
  getRealSecurityGroup(region: Region) {
    const sg = this.realSecurityGroups.find((sg) => sg[region] !== undefined && sg[region] !== null)
    return sg && sg[region] || null

  }

  get isRunning(): boolean { return !!this.runningSince }

  /**
   * Creates actual AWS Security Groups in all regions, with the same access rules
   * and associates it to this (internal) security group
   * @return {Promise<void>}
   */
  async create() {
    const regions = await AwsGlobal.regions()
    let promises = []
    for (const region of regions) {

      AwsGlobal.switchRegion(region)
      promises.push(this.createSecurityGroup(new EC2(), region))

    }

    await Promise.all(promises)

    this.runningSince = new Date()

    promises = []

    // Creates real inbound rules
    for (const rule of this.inbound) {
      promises.push(this.createRealInboundRule(rule))
    }

    await Promise.all(promises)

    promises = []

    // Creates real outbound rules
    for (const rule of this.outbound) {
      promises.push(this.createRealOutboundRule(rule))
    }

    await Promise.all(promises)

  }

  /**
   * Destroys all the actual AWS Security Groups in all regions associated to
   * this (internal) security group
   * @return {Promise<void>}
   */
  async destroy() {
    const regions = await AwsGlobal.regions()
    const promises = []

    for (const region of regions) {

      AwsGlobal.switchRegion(region)
      promises.push(this.deleteSecurityGroup(new EC2()))

    }

    await Promise.all(promises)

    this.runningSince = null
  }

  /**
   * Synchronizes the AWS GroupIDs from all Security Groups, across all regions,
   * associated to this (internal) security group, and populates the Real Security Group map
   * @return {Promise<void>}
   */
  async transformFromAWS() {

    const regions = await AwsGlobal.regions()
    const promises = []

    // Clears real security groups
    this.realSecurityGroups = []

    for (const region of regions) {

      AwsGlobal.switchRegion(region)
      promises.push(this.populateRealSecurityGroup(new EC2(), region))

    }

    await Promise.all(promises)

  }

  /**
   * Adds an inbound access rule to the Security Group
   * If network is running, rule will be added to the real security groups aswell
   * @param {Rule} rule Access rule
   * @return {Promise<void>}
   */
  async addInboundRule(rule: Rule) {
    this.inbound.push(rule)

    if (this.isRunning) {
      await this.createRealInboundRule(rule)
    }

  }

  /**
   * Adds an outbound access rule to the Security Group
   * If network is running, rule will be added to the real security groups aswell
   * @param {Rule} rule Access rule
   * @return {Promise<void>}
   */
  async addOutboundRule(rule: Rule) {
    this.outbound.push(rule)

    if (this.isRunning) {
      await this.createRealOutboundRule(rule)
    }

  }

  private async createRealInboundRule(rule: Rule) {
    if (!this.isRunning) { abort(`Security Group is not running.`) }
    if (!rule.portRangeStart) { abort(`Missing port information.`) }
    if (!rule.source) { abort(`Missing source information.`) }

    const promises = []

    for (const realSg of this.realSecurityGroups) {
      let region = null
      let id = null

      for (const key in realSg) {
        if (realSg.hasOwnProperty(key)) {
          region = key
          id = realSg[key]
        }
      }

      if (!region || !id) { continue }

      AwsGlobal.switchRegion(region as Region)

      promises.push(
        this.setSecurityGroupInboundRule(
          new EC2(), id, 'tcp', rule.source!, rule.portRangeStart!, rule.portRangeEnd,
        ),
      )

    }

    await Promise.all(promises)

  }

  private async createRealOutboundRule(rule: Rule) {
    if (!this.isRunning) { abort(`Security Group is not running.`) }
    if (!rule.portRangeStart) { abort(`Missing port information.`) }
    if (!rule.source) { abort(`Missing source information.`) }

    const promises = []

    for (const realSg of this.realSecurityGroups) {
      let region = null
      let id = null

      for (const key in realSg) {
        if (realSg.hasOwnProperty(key)) {
          region = key
          id = realSg[key]
        }
      }

      if (!region || !id) { continue }

      AwsGlobal.switchRegion(region as Region)

      promises.push(
        this.setSecurityGroupOutboundRule(
          new EC2(), id, 'tcp', rule.source!, rule.portRangeStart!, rule.portRangeEnd,
        ),
      )

    }

    await Promise.all(promises)

  }

  private async populateRealSecurityGroup(ec2: EC2, region: Region) {
    const payload = {
      GroupNames: [this.$id!],
    }
    const data = await ec2.describeSecurityGroups(payload).promise()

    if (!data.SecurityGroups) return

    for (const realSg of data.SecurityGroups) {
      if (!realSg.GroupId) {
        throw new Error('Security Group found, but no ID.')
      }

      this.realSecurityGroups.push({ [region]: realSg.GroupId })

    }
  }

  private async createSecurityGroup(ec2: EC2, region: Region) {

    try {
      const vpcId = await this.getDefaultVpc(ec2)

      const data = await ec2.createSecurityGroup({
        GroupName: this.$id!,
        Description: this.name!,
        VpcId: vpcId,
      }).promise()

      if (!data || !data.GroupId) {
        throw new Error('Security Group not created.')
      }

      this.realSecurityGroups.push({ [region]: data.GroupId })

      await ec2.createTags({
        Resources: [
          data.GroupId,
        ],
        Tags: [
          {
            Key: 'Name',
            Value: this.name!,
          },
          {
            Key: 'Id',
            Value: this.$id!,
          },
          {
            Key: 'NetworkId',
            Value: this.networkId!,
          },
        ],
      }).promise()

    } catch (e) {
      if (e.code === 'InvalidGroup.Duplicate') return
      throw e
    }

  }

  private async getDefaultVpc(ec2: EC2) {

    const payload = {
      Filters: [
        {
          Name: 'isDefault',
          Values: ['true'],
        },
      ],
    }

    const data = await ec2.describeVpcs(payload).promise()

    if (!data || !data.Vpcs || !data.Vpcs[0] || !data.Vpcs[0].VpcId) {
      throw new Error('VPC not found.')
    }

    return data.Vpcs[0].VpcId
  }

  private async deleteSecurityGroup(ec2: EC2) {

    try {
      const payload = {
        GroupName: this.$id!,
      }
      await ec2.deleteSecurityGroup(payload).promise()
    } catch (e) {
      // TODO: Handle errors
      Log(2, e.message)
    }

  }

  private async setSecurityGroupInboundRule(
    ec2: EC2, id: string, protocol: string, source: string, start: number, end: number | null) {

    if (protocol !== 'tcp') abort('system.error.invalidProtocol')

    const payload = {
      GroupId: id,
      IpPermissions: [
        {
          FromPort: start,
          IpProtocol: protocol,
          IpRanges: [
            {
              CidrIp: source,
            },
          ],
          ToPort: end || start,
        },
      ],
    }

    await ec2.authorizeSecurityGroupIngress(payload).promise()

  }

  private async setSecurityGroupOutboundRule(
    ec2: EC2, id: string, protocol: string, source: string, start: number, end: number | null) {

    if (protocol !== 'tcp') abort('system.error.invalidProtocol')

    const payload = {
      GroupId: id,
      IpPermissions: [
        {
          FromPort: start,
          IpProtocol: protocol,
          IpRanges: [
            {
              CidrIp: source,
            },
          ],
          ToPort: end || start,
        },
      ],
    }

    await ec2.authorizeSecurityGroupEgress(payload).promise()

  }

}
