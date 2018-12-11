import {lowerCase} from 'lodash'
import AwsGlobal from '@/model/AwsGlobal'
import {$, Model, errorAndPush} from '@/simpli'

export default class User extends Model {

  username: string | null = null

  accessKeyId: string | null = null

  secretAccessKey: string | null = null

  get bucketName() {
    return lowerCase(this.accessKeyId || '').replace(/ /g, '')
  }

  constructor(accessKeyId?: string, secretAccessKey?: string) {
    super()
    this.accessKeyId = accessKeyId || null
    this.secretAccessKey = secretAccessKey || null
  }

  async populate() {
    const {accessKeyId, secretAccessKey} = this

    await this.validate()
    if (!accessKeyId || !secretAccessKey) return

    this.username = $.t('app.anonymous')

    const fetch = async () => {
      try {
        const resp = await AwsGlobal.iam.getUser().promise()
        this.username = resp.User.UserName
      } catch (e) {
        if (e.code === 'InvalidClientTokenId') {
          errorAndPush('system.error.invalidClientTokenId', '/sign-in', 'httpResponse.403')
        } else if (e.code === 'CredentialsError') {
          errorAndPush('system.error.invalidCredentials', '/sign-in', 'httpResponse.401')
        } else errorAndPush('system.error.unexpectedError', '/sign-in')
        throw e
      }
    }

    await $.await.run(fetch, 'populateUser', 1000)
  }

}
