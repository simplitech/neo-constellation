import {Model, ValidationRequired, ValidationMaxLength} from '@/simpli'
import {Flavor} from '@/enum/Flavor'

export default class Implementation extends Model {

  @ValidationRequired()
  @ValidationMaxLength(100)
  name: string | null = null

  @ValidationRequired()
  flavor: Flavor | null = null

  @ValidationRequired()
  githubLink: string | null = null

  @ValidationRequired()
  startupCommand: string | null = null

  @ValidationRequired()
  chainsZipUrl: string | null = null

}
