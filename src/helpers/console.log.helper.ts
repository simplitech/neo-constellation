
export function log(text: any, obj?: any) {
    if (obj === undefined) {
        obj = text
        text = obj.constructor.name
    }
    console.log(text)
    console.log(obj)
}
