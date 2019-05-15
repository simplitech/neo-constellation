import {$} from '@/simpli'
import { ErrorCode } from '@/enum/ErrorCode'
import { ErrorType } from '@/enum/ErrorType'

export default class Exception extends Error {

  errorCode: ErrorCode
  id: string | null

  constructor(errorCode: ErrorCode, id?: string | null, message?: string) {
    super(message)

    // Set the prototype explicitly.
    Object.setPrototypeOf(this, Exception.prototype)

    this.errorCode = errorCode
    this.id = id || null

    $.snotify.error(message, errorCode)
  }

  ofType(type: ErrorType): Boolean {
    const suffix = this.errorCode - type
    return suffix < 100 && suffix > 0
  }

}
