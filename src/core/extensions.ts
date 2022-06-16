import * as extensionsModule from './defaults'
import extend from './extend'


// Create a Default Registry
const registry = {}
const extensions = {}

for (let key in extensionsModule) extend(extensionsModule[key], extensions, registry)

export {
    registry,
    extensions
}
