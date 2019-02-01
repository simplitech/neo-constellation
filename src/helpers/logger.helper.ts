import Exception from '@/model/Exception'

export function Log(severity: Severity, input: String | Exception | any) {
    if (process.env.VUE_APP_ENV !== 'dev') { return }

    const prefix = `[${Severity[severity]}]`
    let output: String = ''

    if (input instanceof Exception) {
      output = ` Code ${input.errorCode}`

      if (input.id || input.message) {
        output += ': '

        if (input.id && input.message) {
          output += `ID: ${input.id}, Message: ${input.message}.`
        } else if (input.id) {
          output += `ID: ${input.id}.`
        } else {
          output += `Message: ${input.message}.`
        }
      }

    } else if (input instanceof String || typeof input === 'string') {
      output = ` ${input}`
    } else {
      if (input.code && (input.code instanceof String || typeof input.code === 'string')) {
        output = `${output} ${input.code}`
      }
      if (input.message && (input.message instanceof String || typeof input.message === 'string')) {
        output = `${output} ${input.message}`
      }
    }

    switch (severity) {
      case Severity.FATAL:
      case Severity.ERROR:
        console.error(`${prefix}${output}`)
        break
      default:
        console.log(`${prefix}${output}`)
    }

}

export enum Severity {
    INFO = 0,
    WARN = 1,
    ERROR = 2,
    FATAL = 3,
}
