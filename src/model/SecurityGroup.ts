import { abort, ResponseSerialize, Log } from '@/simpli'
import { EC2 } from 'aws-sdk'
import { Region } from '@/enum/Region'
import AwsGlobal from '@/model/AwsGlobal'
import _ from 'lodash'
import Rule from '@/model/Rule'
import Exception from '@/model/Exception'
import { ErrorCode } from '@/enum/ErrorCode'
import { Severity } from '@/helpers/logger.helper'
import { RuleType } from '@/enum/RuleType'
import settle from '@/helpers/settler.helper'

export interface RealSecurityGroup {
  [key: string]: string,
}

export default class SecurityGroup {

  get $tag() {
    if (this.name) {
      return `${this.$id} (${this.name})`
    }
    return this.$id
  }

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

    try {

      for (const region of regions) {

          AwsGlobal.switchRegion(region)
          promises.push(this.createSecurityGroup(new EC2(), region))

        }

      await settle(promises)
    } catch (e) {

      // If Security Group is duplicate, we let it pass
      if (!(e instanceof Exception && e.errorCode === ErrorCode.SECURITY_GROUP_DUPLICATE)) {
        throw new Exception(ErrorCode.ON_CREATE_SECURITY_GROUP, this.$id, e.name)
      }

    }

    this.runningSince = new Date()

    promises = []

    try {
      // Creates real inbound rules
      for (const rule of this.inbound) {
          promises.push(this.createRealRules(RuleType.INBOUND, rule))
        }

      await settle(promises)
    } catch (e) {
      throw new Exception(ErrorCode.ON_CREATE_RULE, this.$id, e.message)
    }

    promises = []

    try {
      // Creates real outbound rules
      for (const rule of this.outbound) {
          promises.push(this.createRealRules(RuleType.OUTBOUND, rule))
        }

      await settle(promises)
    } catch (e) {
      throw new Exception(ErrorCode.ON_CREATE_RULE, this.$id, e.message)
    }

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

    await settle(promises)

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

    await settle(promises)

  }

  /**
   * Adds an access rule to the Security Group
   * If network is running, rule will be added to the real security groups aswell
   * @param {RuleType} type Type of access rule: inbound or outbound
   * @param {Rule} rule Access rule
   * @return {Promise<void>}
   */
  async addRule(type: RuleType, rule: Rule) {

    let rules

    switch (type) {
      case RuleType.INBOUND:
        rules = this.inbound
        break

      case RuleType.OUTBOUND:
        rules = this.outbound
        break
    }

    if (!rules) {
      Log(Severity.WARN, `Rule list not found on Security Group '${this.$id}'.`)
      return
    }

    rules.push(rule)

    if (this.isRunning) {
      try {

        await this.createRealRules(type, rule)

      } catch (e) {

        if (e instanceof Exception) {
          Log(Severity.WARN, `Code ${e.errorCode}: ${e.message}`)
        } else {
          Log(Severity.WARN, e.message)
        }
      }
    }
  }

  /**
   * Removes an access rule from the Security Group
   * If network is running, rule will be removed from the real security groups aswell
   * @param {RuleType} type Type of access rule: inbound or outbound
   * @param {Rule} rule Access rule
   * @return {Promise<void>}
   */
  async removeRule(type: RuleType, rule: Rule) {

    let rules

    switch (type) {
      case RuleType.INBOUND:
        rules = this.inbound
        break

      case RuleType.OUTBOUND:
        rules = this.outbound
        break
    }

    if (!rules) {
      Log(Severity.WARN, `Rule list not found on Security Group '${this.$id}'.`)
      return
    }

    const index = rules.findIndex( (r) => r.equals(rule))
    if (index >= 0) {
      rules.splice(index, 1)
    } else {
      Log(Severity.WARN, `Rule to be removed not found on Security Group '${this.$id}'.`)
    }

    if (this.isRunning) {
      try {

        await this.destroyRealRules(type, rule)

      } catch (e) {

        if (e instanceof Exception) {
          Log(Severity.WARN, `Code ${e.errorCode}: ${e.message}`)
        } else {
          Log(Severity.WARN, e.message)
        }
      }
    }
  }

  private async createRealRules(type: RuleType, rule: Rule) {
    if (!this.isRunning) { throw new Exception(ErrorCode.SECURITY_GROUP_NOT_RUNNING, this.$id) }
    if (!rule.portRangeStart) { throw new Exception(ErrorCode.SECURITY_GROUP_RULE_PORT_MISSING, this.$id) }
    if (!rule.source) { throw new Exception(ErrorCode.SECURITY_GROUP_RULE_SOURCE_MISSING, this.$id) }

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
        this.setSecurityGroupRule(
          new EC2(), type, id, 'tcp', rule.source!, rule.portRangeStart!, rule.portRangeEnd,
        ),
      )

    }

    await settle(promises)

  }

  private async destroyRealRules(type: RuleType, rule: Rule) {
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
        this.unsetSecurityGroupRule(
          new EC2(), type, id, 'tcp', rule.source!, rule.portRangeStart!, rule.portRangeEnd,
        ),
      )

    }

    await settle(promises)

  }

  private async populateRealSecurityGroup(ec2: EC2, region: Region) {
    try {
      const payload = {
        GroupNames: [this.$id!],
      }
      const data = await ec2.describeSecurityGroups(payload).promise()

      if (!data.SecurityGroups) {
        throw new Exception(
          ErrorCode.ON_SYNCHRONIZE_SECURITY_GROUP, this.$id, `Security Group not found on region '${region.toString}'.`,
        )
      }

      for (const realSg of data.SecurityGroups) {
        if (!realSg.GroupId) {
          Log(Severity.WARN, `Security Group '${this.$id}' found on region '${region.toString}', but no GroupID.`)
          continue
        }

        this.realSecurityGroups.push({ [region]: realSg.GroupId })

      }
    } catch (e) {
      throw new Exception(ErrorCode.ON_SYNCHRONIZE_SECURITY_GROUP, this.$id, e.message)
    }
  }

  private async createSecurityGroup(ec2: EC2, region: Region) {

    try {
      if (!this.$id || !this.name || !this.networkId) {
        throw new Exception(ErrorCode.ON_CREATE_SECURITY_GROUP, this.$id, 'Missing information')
      }

      const vpcId = await this.getDefaultVpc(ec2)

      const data = await ec2.createSecurityGroup({
        GroupName: this.$id!,
        Description: this.name!,
        VpcId: vpcId,
      }).promise()

      if (!data || !data.GroupId) {
        throw new Exception(ErrorCode.ON_CREATE_SECURITY_GROUP, this.$id)
      }

      this.realSecurityGroups.push({ [region]: data.GroupId })
      Log(Severity.INFO, `Security Group '${this.$id!}' created on region '${region.toString()}' (${data.GroupId})`)

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
      if (e.code === 'InvalidGroup.Duplicate') {
        throw new Exception(ErrorCode.SECURITY_GROUP_DUPLICATE, this.$id, e.message)
      }

      throw new Exception(ErrorCode.ON_CREATE_SECURITY_GROUP, this.$id, e.message)
    }

  }

  private async getDefaultVpc(ec2: EC2) {
    try {
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
        throw new Exception(ErrorCode.ON_GET_DEFAULT_VPC, this.$id)
      }

      return data.Vpcs[0].VpcId
    } catch (e) {
      throw new Exception(ErrorCode.ON_GET_DEFAULT_VPC, this.$id, e.message)
    }
  }

  private async deleteSecurityGroup(ec2: EC2) {
    try {
      const payload = {
        GroupName: this.$id!,
      }
      await ec2.deleteSecurityGroup(payload).promise()

      Log(Severity.INFO, `Security Group '${this.$id!}' on region ${ec2.config.region} destroyed.`)
    } catch (e) {

      if (e.code === 'InvalidGroup.NotFound') {
        Log(Severity.WARN, e.message)
        return
      }

      throw new Exception(ErrorCode.ON_DESTROY_SECURITY_GROUP, this.$id, e.message)
    }

  }

  private async setSecurityGroupRule(
    ec2: EC2, type: RuleType, id: string, protocol: string, source: string, start: number, end: number | null) {

    try {
      if (protocol !== 'tcp') { throw new Exception(ErrorCode.SECURITY_GROUP_RULE_INVALID_PROTOCOL, this.$id)}

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

      switch (type) {
        case RuleType.INBOUND:
          await ec2.authorizeSecurityGroupIngress(payload).promise()

          Log(Severity.INFO, `Inbound Rule added to Security Group '${this.$id}' on region '${ec2.config.region}'.`)
          break

        case RuleType.OUTBOUND:
          await ec2.authorizeSecurityGroupEgress(payload).promise()

          Log(Severity.INFO, `Outbound Rule added to Security Group '${this.$id}' on region '${ec2.config.region}'.`)
          break
      }
    } catch (e) {

      if (e instanceof Exception) {
        throw e
      }

      throw new Exception(ErrorCode.ON_CREATE_RULE, this.$id)
    }
  }

  private async unsetSecurityGroupRule(
    ec2: EC2, type: RuleType, id: string, protocol: string, source: string, start: number, end: number | null) {

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

    switch (type) {
      case RuleType.INBOUND:
        await ec2.revokeSecurityGroupIngress(payload).promise()

        Log(Severity.INFO, `Inbound Rule removed from Security Group '${this.$id}' on region '${ec2.config.region}'.`)
        break

      case RuleType.OUTBOUND:
        await ec2.revokeSecurityGroupEgress(payload).promise()

        Log(Severity.INFO, `Outbound Rule removed from Security Group '${this.$id}' on region '${ec2.config.region}'.`)
        break
    }
  }

}
