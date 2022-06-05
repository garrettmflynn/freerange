import xml2js from 'xml2js'

export default async (o) => await xml2js.parseStringPromise((!o.text) ? new TextDecoder().decode(o.buffer) : o.text, { explicitCharkey: true })