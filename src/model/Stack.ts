import { S3Wrapper } from '@/app/S3Wrapper'

export default class Stack extends S3Wrapper {

    $prefix = 'stacks/'

    $id: string | null = null
    name: string | null = null
    description: string | null = null

    async list(): Promise<this[]|undefined> {
        return await super.list(Stack)
    }

}
