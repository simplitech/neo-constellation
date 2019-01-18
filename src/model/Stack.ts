import { S3Wrapper } from '@/app/S3Wrapper'
import {syncStacks} from '@/helpers/vuex/auth.helper'

export default class Stack extends S3Wrapper {

    $prefix = 'stacks/'

    $id: string | null = null
    name: string | null = null
    description: string | null = null

    async list(): Promise<this[]|undefined> {
        return await super.list(Stack) || []
    }

    async persist(): Promise<void> {
      await super.persist()
      syncStacks()
    }
}
