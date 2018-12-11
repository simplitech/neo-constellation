import {Model, ValidationRequired} from '../../simpli'

export default class AuthRequest extends Model {
  @ValidationRequired()
  accessKeyId: string = ''

  @ValidationRequired()
  secretAccessKey: string = ''
}
