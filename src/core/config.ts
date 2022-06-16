import { ConfigType } from "./types/config"

const updateConfig = (partialConfig:Partial<ConfigType>={}, fallbacks:Partial<ConfigType>={}): ConfigType => {

    const configClone = Object.assign({}, partialConfig) // Allow mutation internally, but not for user

    // Always Have System
    configClone.system = fallbacks.system

    // Define Creation and Switch Toggles
    if (configClone.create === undefined) configClone.create = fallbacks.create ?? true
    if (configClone.switch === undefined) configClone.switch = fallbacks.switch ?? true
    return configClone as ConfigType // Return full config object
}

export default updateConfig