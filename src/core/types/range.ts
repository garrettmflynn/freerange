export type ResolvedProperties = {
    [x:string]: any
}

export type ResolvedTieredRangeInfo = {
    n: number,
    properties: ResolvedProperties
}

export type PropertiesType<info> = {
    [x:string]: info //| any; // Also augmented by metadata
}

export type ValueGeneratorType<type> = (o: ResolvedProperties, info?: ResolvedTieredRangeInfo, i?: number) => type | Promise<type>

export type MimimumRangeInfo = {
    start: number | number[],
    length: number
}

export type BasicRangeInfo = {
    start: MimimumRangeInfo['start'] | ValueGeneratorType<MimimumRangeInfo['start'][]>, // Array of start values
    length: MimimumRangeInfo['length'] | ValueGeneratorType<MimimumRangeInfo['length']> // Single expected length
}

export type TieredRangeInfo = {
    n: number | ValueGeneratorType<number>,
    properties: PropertiesType<RangeInfo>
} & Partial<BasicRangeInfo> // Optional basic info

export type RangeInfo = (TieredRangeInfo | BasicRangeInfo) & {
    postprocess?: (value: any, o: ResolvedProperties, i: number) => any // Additional arguments...
    ignoreGlobalPostprocess?: boolean
}

export type RangeConfig = {
    properties: PropertiesType<RangeInfo>,
    // postprocess: Function,
    metadata: (o, config:RangeConfig) => any | Promise<any>
    preprocess: (bytes: ArrayBuffer, ...args) => any
}