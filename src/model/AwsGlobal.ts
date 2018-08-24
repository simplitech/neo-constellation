import {EC2} from 'aws-sdk'
import {Region} from '@/enum/Region'
import {AvailabilityZone, Region as RegionAws} from 'aws-sdk/clients/ec2'

export default class AwsGlobal {

  static readonly DEFAULT_REGION = Region.SA_EAST_1

  static ec2: EC2 = new EC2()

  /**
   * Returns regions from AWS
   * @returns {Promise<string[]>}
   */
  static async regions() {
    let list: string[] = []

    const resp = await AwsGlobal.ec2.describeRegions().promise()

    if (resp.Regions) {
      list = resp.Regions
        .filter((item: RegionAws) => !!item.RegionName)
        .map((item: RegionAws) => item.RegionName!)
    }

    return list
  }

  /**
   * Returns availability zones from AWS
   * @returns {Promise<string[]>}
   */
  static async availabilityZones(region?: Region) {

    const payload = {
      Filters: [
        {
          Name: 'region-name',
          Values: [region || '*'],
        },
      ],
    }

    let list: string[] = []

    const resp = await AwsGlobal.ec2.describeAvailabilityZones(payload).promise()

    if (resp.AvailabilityZones) {
      list = resp.AvailabilityZones
        .filter((item: AvailabilityZone) => !!item.ZoneName)
        .map((item: AvailabilityZone) => item.ZoneName!)
    }

    return list
  }

}
