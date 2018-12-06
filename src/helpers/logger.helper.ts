
export function Log(severity: Severity, input: String) {
    if (process.env.VUE_APP_ENV !== 'dev') { return }

    let output: String

    output = `[${Severity[severity]}] ${input}`

    console.log(output)

}

export enum Severity {
    INFO = 0,
    WARN = 1,
    ERROR = 2,
    FATAL = 3,
}
