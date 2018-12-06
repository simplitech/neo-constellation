import { Role } from '@/enum/Role'
import { S3Wrapper } from '@/app/S3Wrapper'

export default class ApplicationBlueprint extends S3Wrapper {

    $prefix = 'application_blueprints/'

    $id: string | null = null
    name: string | null = null
    role: Role | null = null
    dockerImageId: string | null = null
    repositoryUrl: string | null = null
    buildScript: string[] | null = null
    runCommands: string[] = []

}
