import { AnyObj } from "../types"

const stripBOM = str => str.replace(/^\uFEFF/, '')
const normalizeEOL = str => str.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
const isContentfulRow = row => row && !/^\s*$/.test(row)
const addBOM = str => `\ufeff${str}`

export const extension = 'csv'
export const mimeType = "text/csv"



export const encode = (arr: AnyObj[], separator) => {
    const rows = (arr.length) ? [Object.keys(arr[0]), ...arr.map(o => Object.values(o))] : []
    let content = rows.map(row => row.join(separator)).join('\n')
    content = addBOM(content)
    return new TextEncoder().encode(content)
}

export const decode = (o, separator=',') => {
    if (!o.text) o.text = new TextDecoder().decode(o.buffer)
    let contents = o.text
    const collection = []
    contents = stripBOM(contents)
    const rows = normalizeEOL(contents).split('\n').filter(isContentfulRow).map(str => str.split(separator))
    const headers = rows.length ? rows.splice(0, 1)[0] : []

    // Convert to JSON String
    rows.forEach((arr, i) => {
        let strObject = `{`
        strObject += arr.map(
            (val, j) => `"${headers[j]}":${val}` // Otherwise provide object
        ).join(',') 
        strObject+= '}'
        collection.push(strObject)
    })

    // Parse JSON Values
    return collection.map(v => JSON.parse(v))
}