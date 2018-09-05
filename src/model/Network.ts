import {$, Model, ValidationRequired, abort} from '@/simpli'
import {EC2} from 'aws-sdk'
import {Key} from 'aws-sdk/clients/dynamodb'
import {Region} from '@/enum/Region'
import AwsGlobal from '@/model/AwsGlobal'
import Node from '@/model/Node'
import _ from 'lodash'

export default class Network extends Model {

  static readonly DEFAULT_TABLE_NAME = 'network'

  static async list() {
    const result: Network[] = []
    const networkListFromNodes: string[] = []
    let networkListFromDDB: string[] = []

    const fetch = async () => {

      // Get or create
      const table = await this.getDynamoTable() || await this.createDynamoTable()

      // Query
      const data = await this.queryNetworkList()
      networkListFromDDB = data!.filter((n) => n.idNetwork.S).map((n) => n.idNetwork.S!)

      const allNodes = await Node.list()

      const networkObj = _.groupBy(allNodes, 'idNetwork')

      for (const idNetwork in networkObj) {
        if (idNetwork) {
          const network = new Network()
          network.$id = idNetwork
          network.nodes = networkObj[idNetwork]
          result.push(network)

          // Adds to a list instead of filtering, for performance
          networkListFromNodes.push(idNetwork)
        }
      }

      // Adds networks that are in the database, but don't have nodes in them
      for (const idNetwork of _.difference(networkListFromDDB, networkListFromNodes)) {
        const network = new Network()
        network.$id = idNetwork
        result.push(network)
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

  private static async getDynamoTable() {
    const payload = {
      TableName: Network.DEFAULT_TABLE_NAME,
    }
    try {
      const data = await AwsGlobal.ddb.describeTable(payload).promise()
      return data.Table
     } catch (e) {
      console.log(e)
      if (e.code === 'ResourceNotFoundException') return
      throw e
     }
  }

  private static async createDynamoTable() {
    const payload = {
      AttributeDefinitions: [
        {
          AttributeName: 'idNetwork',
          AttributeType: 'S',
        },
      ],
      KeySchema: [
        {
          AttributeName: 'idNetwork',
          KeyType: 'HASH',
        },
      ],
      TableName: Network.DEFAULT_TABLE_NAME,
      ProvisionedThroughput: {
        ReadCapacityUnits: 10,
        WriteCapacityUnits: 10,
      },
    }

    const data = await AwsGlobal.ddb.createTable(payload).promise()

    // Waits for table creation
    await AwsGlobal.ddb.waitFor('tableExists', {TableName: Network.DEFAULT_TABLE_NAME}).promise()

    return data.TableDescription

  }

  private static async queryNetworkList() {

    const payload = {
      TableName: Network.DEFAULT_TABLE_NAME,
      ConsistentRead: true,
    }

    try {
      const data = await AwsGlobal.ddb.scan(payload).promise()

      return data.Items
    } catch (e) {
      console.log(e)
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

    const sgPayload = {
      GroupName: groupName,
    }

    const ddbPayload = {
      Key: {
        idNetwork: {
          S: $id || undefined,
        },
      },
      TableName: Network.DEFAULT_TABLE_NAME,
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
        promises.push(new EC2().deleteSecurityGroup(sgPayload).promise())
      }

      // Removes from DDB
      promises.push(AwsGlobal.ddb.deleteItem(ddbPayload).promise())

      await Promise.all(promises)

    } catch (e) {
      if (e.code !== 'InvalidGroup.NotFound') throw e
    }
  }

}
