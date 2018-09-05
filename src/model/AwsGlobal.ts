import AWS, {EC2, S3, SSM} from 'aws-sdk'
import IAM from 'aws-sdk/clients/iam'
import DDB from 'aws-sdk/clients/dynamodb'
import {AvailabilityZone, Region as RegionAws} from 'aws-sdk/clients/ec2'
import Network from '@/model/Network'
import {Region} from '@/enum/Region'
import {Size} from '@/enum/Size'
import {Zone} from '@/enum/Zone'

export default abstract class AwsGlobal {

  static readonly DEFAULT_REGION = Region.SA_EAST_1

  static ec2: EC2 = new EC2()
  static iam: IAM = new IAM()
  static s3: S3 = new S3()
  static ssm: SSM = new SSM()
  static ddb: DDB

  /**
   * Switch AWS Region
   * @param {Region} region
   */
  static switchRegion(region: Region) {
    AWS.config.update({region})
  }

  /**
   * Returns networks
   * @returns {Promise<string[]>}
   */
  static async networks(): Promise<string[]> {
    const list = await Network.list()
    return list
      .filter((item: Network) => !!item.$id)
      .map((item: Network) => item.$id!)
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
      AwsGlobal.switchRegion(region)
      ec2 = new EC2()
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
