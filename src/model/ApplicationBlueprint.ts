import {Role} from '@/enum/Role'
import {S3Wrapper} from '@/app/S3Wrapper'
import {$, syncAppBlueprints, ValidationRequired} from '@/simpli'

export default class ApplicationBlueprint extends S3Wrapper {
  $name: string = 'ApplicationBlueprint'

  $prefix = 'application_blueprints/'

  $id: string | null = null

  @ValidationRequired()
  name: string | null = null

  @ValidationRequired()
  role: Role | null = null

  dockerImageId: string | null = null

  repositoryUrl: string | null = null

  buildScript: string[] | null = null

  runCommands: string[] = []

  get htmlBuildScript() {
    return this.stringBuildScript.replace(/\n/gm, '<br>')
  }

  get stringBuildScript() {
    if (this.buildScript) {
      return this.buildScript.join('\n')
    }
    return ''
  }

  set stringBuildScript(val: string) {
    this.buildScript = val.split('\n')
  }

  get htmlRunCommands() {
    return this.stringRunCommands.replace(/\n/gm, '<br>')
  }

  get stringRunCommands() {
    return this.runCommands.join('\n')
  }

  set stringRunCommands(val: string) {
    this.runCommands = val.split('\n')
  }

  async list(): Promise<this[] | undefined> {
    const fetch = async () => await super.list(ApplicationBlueprint) || []
    return $.await.run(fetch, 'listApplicationBlueprint')
  }

  async persist(): Promise<void> {
    await super.persist()
    syncAppBlueprints()
  }
}
