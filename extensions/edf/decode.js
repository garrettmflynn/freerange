import EDF from './edf-io/src/EDF.js'

export default async (o) => {
    const edf = new EDF(o.buffer)
    return edf
}