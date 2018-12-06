import {
    uid,
    abort,
    Model,
    success,
    getUser,
    getExtension,
} from '@/simpli'
import AwsGlobal from '@/model/AwsGlobal'
import {plainToClassFromExist, classToPlainFromExist} from 'class-transformer'

export abstract class S3Wrapper extends Model {

    abstract $id: string | null
    abstract readonly $prefix: string

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
}
