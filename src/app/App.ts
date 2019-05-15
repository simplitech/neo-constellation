import Network from '@/model/Network'
import ApplicationBlueprint from '@/model/ApplicationBlueprint'
import Stack from '@/model/Stack'

export abstract class App {
  static environment: Network | null = null
  static networks: Network[] = []
  static appBlueprints: ApplicationBlueprint[] = []
  static stacks: Stack[] = []
}
