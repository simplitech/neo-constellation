import {
    uid,
    abort,
    Model,
    success,
    getUser,
    getExtension,
} from '@/simpli'
import AwsGlobal from '@/model/AwsGlobal'
import {plainToClass, plainToClassFromExist, classToPlainFromExist, Type} from 'class-transformer'
import Network from '@/model/Network'

export abstract class S3Wrapper extends Model {

    abstract $id: string | null
    protected abstract readonly $prefix: string

    async get(id: String) {

        try {

          const s3 = AwsGlobal.s3

          // Fetches the object
          const objData = await s3.getObject({
            Key: `${this.$prefix}${id}${getExtension()}`,
            Bucket: getUser().bucketName,
          }).promise()

          // Object body is an Uint8Array
          const stringJson = new TextDecoder('utf-8').decode(objData.Body as Uint8Array)
          const objJson = JSON.parse(stringJson)

          // Returns the deserialized object
          return plainToClassFromExist(this, objJson)

        } catch (e) {
          // TODO: Handle errors
          throw e
        }
    }

    async persist() {

        if (this.$id === null) {
            this.$id = uid()
        }

        try {

            const s3 = AwsGlobal.s3

            const objJson = classToPlainFromExist(this, this)
            const stringJson = JSON.stringify(objJson)

            await s3.putObject({
                Body: stringJson,
                Key: `${this.$prefix}${this.$id}${getExtension()}`,
                Bucket: getUser().bucketName,
            }).promise()

            success(`${typeof this} persisted.`, undefined, false)

        } catch (e) {
          // TODO: Handle errors
          throw e
        }
    }

    async delete() {

        if (!this.$id) { abort(`Missing ID information`)}

        try {

            const s3 = AwsGlobal.s3

            // Deletes the object
            await s3.deleteObject({
              Key: `${this.$prefix}${this.$id}${getExtension()}`,
              Bucket: getUser().bucketName,
            }).promise()

            success(`${typeof this} deleted.`, undefined, false)

          } catch (e) {
            // TODO: Handle errors
            throw e
          }
    }

    async list(type: typeof S3Wrapper) {

        try {

            const s3 = AwsGlobal.s3

            const data = await s3.listObjectsV2({
                Bucket: getUser().bucketName,
                Prefix: this.$prefix,
            }).promise()

            success(`Listing ${typeof this}...`, undefined, false)

            const idList = data.Contents
                && data.Contents
                    .filter((c) => !!c.Key)
                    .map((c) => {
                        return c.Key!
                            .replace(`${this.$prefix}`, '')
                            .replace(`${getExtension()}`, '')
                    }) || undefined

            if (!idList) return undefined

            const objList: this[] = []

            for (const id of idList) {
                const entity = new (type as any)() as this
                objList.push(await entity.get(id))
            }

            return objList

        } catch (e) {
            // TODO: Handle errors
            throw e
        }
    }
}
