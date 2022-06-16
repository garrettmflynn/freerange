import * as csv from './csv'

export const type = "text/tab-separated-values"
export const suffixes = 'tsv'
export const encode = (arr) => csv.encode(arr, '\t')
export const decode = (arr) => csv.decode(arr, '\t')