import AWS, {EC2, S3, SSM, DynamoDB} from 'aws-sdk'
import IAM from 'aws-sdk/clients/iam'
import {AvailabilityZone, Region as RegionAws} from 'aws-sdk/clients/ec2'
import {Region} from '@/enum/Region'
import {Size} from '@/enum/Size'
import {Zone} from '@/enum/Zone'

export default abstract class AwsGlobal {

  static readonly DEFAULT_REGION = Region.US_EAST_1

  static ec2: EC2 = new EC2({region: AwsGlobal.DEFAULT_REGION})
  static iam: IAM = new IAM({region: AwsGlobal.DEFAULT_REGION})
  static s3: S3 = new S3({region: AwsGlobal.DEFAULT_REGION})
  static ssm: SSM = new SSM({region: AwsGlobal.DEFAULT_REGION})

  /**
   * Reset entities
   */
  static reset() {
    AwsGlobal.ec2 = new EC2({region: AwsGlobal.DEFAULT_REGION})
    AwsGlobal.s3 = new S3({region: AwsGlobal.DEFAULT_REGION})
    AwsGlobal.iam = new IAM({region: AwsGlobal.DEFAULT_REGION})
  }

  /**
   * Switch AWS Region
   * @param {Region} region
   */
  static switchRegion(region: Region) {
    AWS.config.update({region})
  }

  /**
   * Returns regions from AWS
   * @returns {Promise<Region[]>}
   */
  static async regions(): Promise<Region[]> {
    let list: Region[] = []

    const resp = await AwsGlobal.ec2.describeRegions().promise()

    if (resp.Regions) {
      list = resp.Regions
        .filter((item: RegionAws) => !!item.RegionName)
        .map((item: RegionAws) => item.RegionName!) as Region[]
    }

    return list
  }

  /**
   * Returns sizes from AWS
   * @returns {Promise<Size[]>}
   */
  static async sizes(): Promise<Size[]> {
    const list: Size[] = []

    for (const item in Size) {
      if (item) list.push(Size[item] as Size)
    }

    return list
  }

  /**
   * Returns availability zones from AWS
   * @returns {Promise<Zone[]>}
   */
  static async availabilityZones(region?: Region): Promise<Zone[]> {
    let ec2 = AwsGlobal.ec2

    if (region) {
      ec2 = new EC2({region})
    }

    let list: Zone[] = []

    const resp = await ec2.describeAvailabilityZones().promise()

    if (resp.AvailabilityZones) {
      list = resp.AvailabilityZones
        .filter((item: AvailabilityZone) => !!item.ZoneName)
        .map((item: AvailabilityZone) => item.ZoneName!) as Zone[]
    }

    return list
  }

}
