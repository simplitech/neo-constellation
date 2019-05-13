import {lowerCase} from 'lodash'
import AwsGlobal from '@/model/AwsGlobal'
import {$, Model, abort, signOut} from '@/simpli'

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
        signOut()
        if (e.code === 'InvalidClientTokenId') {
          abort('system.error.invalidClientTokenId', 'httpResponse.403')
        } else if (e.code === 'CredentialsError') {
          abort('system.error.invalidCredentials', 'httpResponse.401')
        } else {
          abort('system.error.unexpectedError')
        }
        throw e
      }
    }

    await $.await.run(fetch, 'authentication', 1000)
  }

}
