import {$, Model, ValidationRequired} from '@/simpli'
import {EC2} from 'aws-sdk'
import {Region} from '@/enum/Region'
import AwsGlobal from '@/model/AwsGlobal'
import Node from '@/model/Node'
import _ from 'lodash'
import { abort } from '@/helpers/custom.helper'

export default class Network extends Model {

  static async list() {
    const result: Network[] = []

    const fetch = async () => {
      const allNodes = await Node.list()

      const networkObj = _.groupBy(allNodes, 'idNetwork')

      for (const idNetwork in networkObj) {
        if (idNetwork) {
          const network = new Network()
          network.$id = idNetwork
          network.nodes = networkObj[idNetwork]
          result.push(network)
        }
      }
    }

    await $.await.run(fetch, 'networks')

    return result
  }

  static manageStateFromList(networks: Network[]) {
    for (const network of networks) {
      for (const node of network.nodes) {
        const fetch = async () => await node.manageState()
        $.await.run(fetch, `node_${node.$id}`)
      }
    }
  }

  $id: string | null = null

  name: string | null = null

  nodes: Node[] = []

  get groupName() {
    return `network-${this.$id}-sg`
  }

  async get(idNetwork: string) {
    this.$id = idNetwork
    this.nodes = await Node.list(idNetwork)
  }

  async destroy() {
    const {$id, nodes, groupName} = this
    const {regions, switchRegion} = AwsGlobal

    if (!$id) abort('system.error.fieldNotDefined')
    if (nodes && nodes.length > 0) abort('system.error.networkNotEmpty')

    const payload = {
      GroupName: groupName,
    }

    // Deletes security groups across regions
    console.log(`Destroying ${$id}...`)

    // List of promises
    const promises = []

    const listRegion = await regions()

    // Scan all AWS regions
    try {
      for (const region of listRegion) {
        switchRegion(region)
        promises.push(new EC2().deleteSecurityGroup(payload).promise())
      }
      await Promise.all(promises)

    } catch (e) {
      if (e.code !== 'InvalidGroup.NotFound') throw e
    }

  }

}
