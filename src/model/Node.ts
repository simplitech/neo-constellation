import {Model, ValidationRequired, ResponseHidden, ValidationMaxLength} from '@/simpli'
import {Size} from '@/enum/Size'
import {Region} from '@/enum/Region'
import {Zone} from '@/enum/Zone'

export default class Node extends Model {

  @ValidationRequired()
  @ValidationMaxLength(100)
  name: string | null = null

  @ValidationRequired()
  size: Size | null = null

  @ValidationRequired()
  region: Region | null = null

  @ValidationRequired()
  availabilityZone: Zone | null = null

  @ValidationRequired()
  RPC: boolean = false

  nep6Wallet: string | null = null

  @ResponseHidden()
  walletPassword: string | null = null

}
