import Node from '@/model/Node'
import { $ } from '@/simpli'
import { abort } from '@/helpers/custom.helper'

export default class Container {

  static validate(input: string) {
    const regex = /^(.*),(.*),(.*),(.*),(.*),(.*),(.*),(.*),(.*),(.*),(.*),(.*)$/
    const match = input.match(regex)
    return match ? true : false
  }

  id?: string
  image?: string
  command?: string
  createdAt?: string
  runningFor?: string
  ports?: string
  status?: string
  size?: string
  names?: string
  labels?: string
  mounts?: string
  networks?: string

  get(containerInfo: string) {
    const properties = containerInfo.split(',')

    this.id = properties[0] || ''
    this.image = properties[1] || ''
    this.command = properties[2] || ''
    this.createdAt = properties[3] || ''
    this.runningFor = properties[4] || ''
    this.ports = properties[5] || ''
    this.status = properties[6] || ''
    this.size = properties[7] || ''
    this.names = properties[8] || ''
    this.labels = properties[9] || ''
    this.mounts = properties[10] || ''
    this.networks = properties[11] || ''

  }

}
