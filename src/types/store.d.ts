import {ID, Currency, Lang} from '@/simpli'
import User from '@/model/User'
import NetworkV2 from '@/model/Network.v2'
import ApplicationBlueprint from '@/model/ApplicationBlueprint'

/**
 * Root
 */
export interface RootState {
  version: string
  language: Lang
  currency: Currency
  year: number
  extension: string
}

/**
 * Auth Module
 */
export interface AuthState {
  accessKeyId: string | null,
  secretAccessKey: string | null,
  user: User,
  networks: NetworkV2[],
  appBlueprints: ApplicationBlueprint[],
  // stacks: Stack[],
  cachePath: string | null,
  eventListener: AuthEventListener,
}

export interface AuthEventListener {
  [key: string]: Array<(...params: any[]) => void>
}
