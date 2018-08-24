import {EC2, S3, SSM} from 'aws-sdk'
import IAM from 'aws-sdk/clients/iam'
import {Region} from '@/enum/Region'
import {AvailabilityZone, Region as RegionAws} from 'aws-sdk/clients/ec2'

export default abstract class AwsGlobal {

  static readonly DEFAULT_REGION = Region.SA_EAST_1

  static ec2: EC2 = new EC2()
  static iam: IAM = new IAM()
  static s3: S3 = new S3()
  static ssm: SSM = new SSM()

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
