import EDF from './edf-io/src/index.js'

export default async (o) => {
    const edf = new EDF(o.buffer)
    return edf
}