import * as text from './text.js'
export const mimeType = "application/json"
export const extension = 'json'

export const encode = (o) => text.encode(JSON.stringify(o))
export const decode = (o) => JSON.parse((!o.text) ? text.decode(o) : o.text)