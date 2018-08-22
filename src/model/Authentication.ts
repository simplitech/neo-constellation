import {Model, ValidationRequired} from '@/simpli'

export default class Authentication extends Model {
  @ValidationRequired()
  accessKeyId: string = ''

  @ValidationRequired()
  secretAccessKey: string = ''
}
