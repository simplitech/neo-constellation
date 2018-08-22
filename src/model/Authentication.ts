import {Model, ValidationRequired} from '@/simpli'

export default class Authentication extends Model {
  @ValidationRequired()
  accessKeyId: string | null = null

  @ValidationRequired()
  secretAccessKey: string | null = null
}
