import {Model, ValidationRequired, ValidationMaxLength} from '@/simpli'
import {Status} from '@/enum/Status'
import {Flavor} from '@/enum/Flavor'

export default class Script extends Model {

  @ValidationRequired()
  startAfter: Status | null = null

  @ValidationMaxLength(1000)
  executionDelay: number | null = null

  @ValidationRequired()
  flavor: Flavor | null = null

  @ValidationRequired()
  githubLink: string | null = null

  @ValidationRequired()
  startupCommand: string | null = null

}
