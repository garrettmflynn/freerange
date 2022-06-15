import * as text from './text'
export const mimeType = "application/json"
export const extension = 'json'

export const encode = (o) => text.encode(JSON.stringify(o))
export const decode = (o) => {
    const textContent = (!o.text) ? text.decode(o) : o.text
    return JSON.parse(textContent || `{}`)
}