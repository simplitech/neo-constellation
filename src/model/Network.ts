import {Model, ValidationRequired, ValidationMaxLength, ResponseSerialize} from '@/simpli'
import Node from '@/model/Node'

export default class Network extends Model {

  @ValidationRequired()
  @ValidationMaxLength(100)
  name: string | null = null

  @ValidationRequired()
  s3Bucket: string | null = null

  @ValidationRequired()
  magic: number | null = null

  @ValidationRequired()
  addressVersion: number | null = null

  @ValidationRequired()
  secondsPerBlock: number | null = null

  @ValidationRequired()
  enrollmentTransaction: number | null = null

  @ValidationRequired()
  issueTransaction: number | null = null

  @ValidationRequired()
  publishTransaction: number | null = null

  @ValidationRequired()
  registerTransaction: number | null = null

  @ResponseSerialize(Node)
  nodes: Node[] = []

  seeds: string[] = []

}
