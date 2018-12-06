import PortForwarding from '@/model/PortForwarding'
import ApplicationBlueprint from '@/model/ApplicationBlueprint'

export default class Application {

  name: string | null = null
  blueprint: ApplicationBlueprint | null = null
  containerId: string | null = null
  ports: PortForwarding[] = []

}
