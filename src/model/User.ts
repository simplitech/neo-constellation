import {Model, ValidationRequired} from '@/simpli'
import {EC2, S3} from 'aws-sdk'

export default class User extends Model {
  @ValidationRequired()
  ec2: EC2 | null = null

  @ValidationRequired()
  s3: S3 | null = null
}
