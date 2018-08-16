import {Model, ResponseSerialize, ValidationRequired, ValidationMaxLength} from '@/simpli'
import {Zone} from '@/enum/Zone'
import {Region} from '@/enum/Region'
import {Size} from '@/enum/Size'
import Script from '@/model/Script'

export default class Simulation extends Model {

  @ValidationRequired()
  @ValidationMaxLength(100)
  name: string | null = null

  @ValidationRequired()
  size: Size | null = null

  @ValidationRequired()
  region: Region | null = null

  @ValidationRequired()
  availabilityZone: Zone | null = null

  @ResponseSerialize(Script)
  scripts: Script[] = []

}
