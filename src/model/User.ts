import {  Model, abort } from '@/simpli'
import _ from 'lodash'
import {EC2, S3, SSM, IAM, CloudWatchLogs as CWL} from 'aws-sdk'

const RSA = require('node-rsa')

export default class User extends Model {

    username?: string
    accessKeyId?: string
    secretAccessKey?: string
    get bucketName() { return _.lowerCase(this.accessKeyId).replace(/ /g, '') }

}
