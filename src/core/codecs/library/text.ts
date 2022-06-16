export const type = "text/plain"
export const suffixes = 'txt'
export const encode = (o) => new TextEncoder().encode(o ? o.toString() : '')
export const decode = (o) => new TextDecoder().decode(o.buffer)