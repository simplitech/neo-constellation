import {Currency, Lang} from '@/simpli'
import User from '@/model/User'
import Network from '@/model/Network'
import ApplicationBlueprint from '@/model/ApplicationBlueprint'
import Stack from '@/model/Stack'

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
  networks: Network[],
  appBlueprints: ApplicationBlueprint[],
  stacks: Stack[],
  cachePath: string | null,
  eventListener: AuthEventListener,
}

export interface AuthEventListener {
  [key: string]: Array<(...params: any[]) => void>
}
