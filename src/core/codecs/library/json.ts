import * as text from './text'
export const type = "application/json"
export const suffixes = 'json'

export const encode = (o) => text.encode(JSON.stringify(o))
export const decode = (o) => {
    const textContent = (!o.text) ? text.decode(o) : o.text
    return JSON.parse(textContent || `{}`)
}