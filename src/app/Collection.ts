import {
    abort,
    Model,
    success,
    bucketName,
    getExtension,
} from '@/simpli'
import AwsGlobal from '@/model/AwsGlobal'
import { plainToClassFromExist } from 'class-transformer'
import { S3Wrapper } from '@/app/S3Wrapper'

export default class Collection<T extends S3Wrapper> {

    items: T[] = []

    readonly type: any

    get resource() {
        return new this.type() as T
    }

    constructor(type: any) {
        this.type = type
    }

    async list() {

        // Gets the info from S3
        try {
            const s3 = AwsGlobal.s3

            const data = await s3.listObjectsV2({
                Prefix: this.resource.$prefix,
                Bucket: bucketName(),
            }).promise()

            // Contents is an array of object keys (names)
            if (data.Contents) {
                for (const object of data.Contents) {

                    // Disconsiders objects that end with '/', because they represent a folder
                    if (object.Key && !object.Key.endsWith('/')) {

                        // Fetches each object
                        const objData = await s3.getObject({
                            Key: object.Key,
                            Bucket: bucketName(),
                        }).promise()

                        // Object body is an Uint8Array
                        const stringJson = new TextDecoder('utf-8').decode(objData.Body as Uint8Array)
                        const objJson = JSON.parse(stringJson)

                        // Deserializes the JSON and pushes the new object into the list, to be returned
                        this.items.push(plainToClassFromExist(this.resource, objJson))

                    }
                }
            }

            return this.items

        } catch (e) {
            // TODO: Handle errors
            throw e
        }
    }

}
