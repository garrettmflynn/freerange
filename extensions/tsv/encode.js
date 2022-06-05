const addBOM = str => `\ufeff${str}`//.replace(/^\uFEFF/, '') // TODO
export default (arr) => {
    const rows = (arr.length) ? [Object.keys(arr[0]), ...arr.map(o => Object.values(o))] : []
    let content = rows.map(row => row.join('\t')).join('\n')
    content = addBOM(content)
    return new TextEncoder().encode(content)
}