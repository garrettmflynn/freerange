import { RangeConfig } from "../../src/common/types/range";

// Derived from https://github.com/Neurobotics/jsEDF, released under the MIT license by neurobotics


// Notes
// 1. Must still test a file with annotations...
//
//


const flipBits = (n) => parseInt(n.toString(2).split('').map(bit => 1 - bit).join(''), 2)

const config: RangeConfig = {

    // Range Gettable Properties
    properties: {


        // ------------- TODO: Create a Macro for the File Header -------------
        // header: {
        //     properties: {
        header: {
            start: 0,
            length: 8
        },
        patient: {
            start: 8,
            length: 80
        },
        info: {
            start: 88,
            length: 80
        },
        date: {
            start: 168,
            length: 8
        },
        time: {
            start: 176,
            length: 8
        },
        headerBytes: {
            start: 184,
            length: 8,
            postprocess: (v) => parseInt(v)
        },
        dataFormat: {
            start: 192,
            length: 44
        },
        dataRecords: {
            start: 236,
            length: 8,
            postprocess: (v) => parseInt(v)
        },
        dataRecordDuration: {
            start: 244,
            length: 8,
            postprocess: (v) => parseFloat(v)
        },
        channelCount: {
            start: 252,
            length: 4,
            postprocess: (v) => parseInt(v)
        },
        //     }
        // },

        // ------------- Generate an Array of Channels -------------
        channels: {
            n: (o) => o.channelCount,
            properties: {
                label: {
                    length: 16,
                    start: (o, _, i) => o.headerOffset + 16 * i,
                    postprocess: (value, o) => {
                        if (value.indexOf("DF Annotations") > 0) o.hasAnnotations = true;
                        return value
                    }
                },
                transducer: {
                    length: 80,
                    start: (o, info, i) => o.headerOffset + 16 * info.n + 80 * i,
                },
                dimensions: {
                    length: 8,
                    start: (o, info, i) => o.headerOffset + 16 * info.n + 80 * info.n + 8 * i
                },
                physMin: {
                    length: 8,
                    start: (o, info, i) => o.headerOffset + 16 * info.n + 80 * info.n + 8 * info.n + 8 * i,
                    postprocess: (v) => parseInt(v)
                },
                physMax: {
                    length: 8,
                    start: (o, info, i) => o.headerOffset + 16 * info.n + 80 * info.n + 8 * info.n + 8 * info.n + 8 * i,
                    postprocess: (v) => parseInt(v)
                },
                digitalMin: {
                    length: 8,
                    start: (o, info, i) => o.headerOffset + 16 * info.n + 80 * info.n + 8 * info.n + 8 * info.n + 8 * info.n + 8 * i,
                    postprocess: (v) => parseInt(v)
                },
                digitalMax: {
                    length: 8,
                    start: (o, info, i) => o.headerOffset + 16 * info.n + 80 * info.n + 8 * info.n + 8 * info.n + 8 * info.n + 8 * info.n + 8 * i,
                    postprocess: (v) => parseInt(v)
                },
                prefilters: {
                    length: 80,
                    start: (o, info, i) => o.headerOffset + 16 * info.n + 80 * info.n + 8 * info.n + 8 * info.n + 8 * info.n + 8 * info.n + 8 * info.n + 80 * i,
                },
                numSamples: {
                    length: 8,
                    start: (o, info, i) => o.headerOffset + 16 * info.n + 80 * info.n + 8 * info.n + 8 * info.n + 8 * info.n + 8 * info.n + 8 * info.n + 80 * info.n + 8 * i,
                    postprocess: async (value, o, i) => {
                        const n = await o.channelCount
                        if (o.hasAnnotations && i == n - 1) o.annotationBytes = value * 2; // Account for annotation channel
                        return value
                    }
                },
                k: {
                    // TODO: Understand why the buffer increments without new data...
                    length: 32,
                    start: (o, info, i) => o.headerOffset + 16 * info.n + 80 * info.n + 8 * info.n + 8 * info.n + 8 * info.n + 8 * info.n + 8 * info.n + 80 * info.n + 8 * info.n + 32 * i,
                    postprocess: async (value, o, i) => {
                        const pMax = await o.channels[i].physMax
                        const pMin = await o.channels[i].physMin
                        const dMax = await o.channels[i].digitalMax
                        const dMin = await o.channels[i].digitalMin
                        return (pMax - pMin) / (dMax - dMin);
                    }
                },

                data: {

                    // Returns a Collection of Byte Ranges to Process
                    length: async (o) => {
                        const samples = await o.samplesInOneDataRecord
                        const bps = await o.bytesPerSample
                        return samples * bps
                    },
                    start: async (o, info, i) => {

                        const start = []
                        try {

                            const hasAnnotations = await o.hasAnnotations
                            const perChannelOffset = await o.perChannelOffset
                            const records = await o.dataRecords
                            const annotationBytes = await o.annotationBytes
                            const headerBytes = await o.headerBytes

                            let realChannelCount = (hasAnnotations) ? info.n - 1 : info.n
                            let pos = headerBytes + i * (perChannelOffset) // First run position


                            for (var j = 0; j < records; j++) {
                                start.push(pos)
                                pos += annotationBytes + (perChannelOffset * realChannelCount)// Account for difference in annotation bytes
                            }

                        } catch (e) { console.error(e) }
                        return start
                    },

                    // Process Collection of Byte Ranges
                    ignoreGlobalPostprocess: true,
                    postprocess: async (arr, o, i) => {

                        try {
                            const bps = await o.bytesPerSample
                            const kcoef = await o.channels[i].k

                            // return arr.map(arr => {
                            const buffer = []
                            for (let i = 0; i < arr.length; i += bps) {
                                let val;
                                if (bps == 2) {
                                    const [b1, b2] = arr.slice(i, i + 2)
                                    val = (b2 << 8) + b1;
                                    if (b2 >> 7 == 1) val = -flipBits(val) - 1;
                                }
                                else if (bps == 3) {
                                    const [b1, b2, b3] = arr.slice(i, i + 3)
                                    val = (b3 << 16) + (b2 << 8) + b1;
                                    if (b3 >> 7 == 1) val = -flipBits(val) - 1;
                                }
                                buffer.push(val * kcoef) // TODO: Figure out what kcoeff is...
                            }

                            return buffer
                            // })
                        } catch (e) { console.error(e) }
                    }
                }
            }
        },

        // ------------- Get EDF Annotations -------------
        annotations: {
            length: (o) => o.annotationBytes,
            start: async (o) => {

                try {
                    const start = []
                    const annotationBytes = await o.annotationBytes
                    const hasAnnotations = await o.hasAnnotations

                    if (hasAnnotations && annotationBytes) {
                        let offset = await o.headerBytes
                        const records = await o.dataRecords
                        const perChannelOffset = await o.perChannelOffset
                        const channelCount = await o.channelCount

                        let realChannelCount = (hasAnnotations) ? channelCount - 1 : channelCount

                        for (var j = 0; j < records; j++) {
                            offset += realChannelCount * perChannelOffset // Go to the end of the channels
                            start.push(offset)
                            offset += annotationBytes // Add the annotation bytes to the offset
                        }
                        return start
                    } else return [] // No annotations

                } catch (e) { console.error(e) }
            }
        }
    },

    // ------------- Track File Metadata -------------
    metadata: async (o, config) => {

        const n = await o.channelCount;
        o.headerOffset = 256
        o.duration = await o.dataRecordDuration * await o.dataRecords;

        const header = await o.header
        o.bytesPerSample = header == "0" ? 2 : 3;
        o.hasAnnotations = false;
        o.annotationBytes = 0;

        if (n > 0) {
            o.samplingRate = await o.channels[0]?.numSamples * await o.dataRecordDuration;
            o.sampleSize = 0;
        }

        if (o.hasAnnotations) o.sampleSize = (n - 1) * 2 * await o.samplingRate + 60 * 2;
        else o.sampleSize = (n) * 2 * await o.samplingRate;
        o.samplesInOneDataRecord = await o.samplingRate * await o.dataRecordDuration;
        o.perChannelOffset = await o.samplesInOneDataRecord * await o.bytesPerSample;
    },

    // ------------- Global Byte Conversion -------------
    preprocess: (bytes) => {
        return bytes.reduce((a, b) => {
            return a + String.fromCharCode(b)
        }, '').trim();
    },
}

export default config