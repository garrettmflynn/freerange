import * as csv from './csv'

export const mimeType = "text/tab-separated-values"
export const extension = 'tsv'
export const encode = (arr) => csv.encode(arr, '\t')
export const decode = (arr) => csv.decode(arr, '\t')