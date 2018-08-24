import {Model, ValidationRequired} from '@/simpli'
import {EC2} from 'aws-sdk'
import {Region} from '@/enum/Region'
import AwsGlobal from '@/model/AwsGlobal'
import Node from '@/model/Node'
import _ from 'lodash'

export default class Network extends Model {

  static async list() {
    const result: Network[] = []

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

    return result
  }

  $id: string | null = null

  name: string | null = null

  nodes: Node[] = []

  async get(idNetwork: string) {
    this.$id = idNetwork
    this.nodes = await Node.list(idNetwork)
  }

}
