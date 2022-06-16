import EDF from './edf-io/src/EDF'

export default async (o) => {
    const edf = new EDF(o.buffer)
    return edf
}