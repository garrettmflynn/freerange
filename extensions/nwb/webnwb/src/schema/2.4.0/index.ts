import base from './core/nwb.base.yaml'
import behavior from './core/nwb.behavior.yaml'
import device from './core/nwb.device.yaml'
import ecephys from './core/nwb.ecephys.yaml'
import epoch from './core/nwb.epoch.yaml'
import file from './core/nwb.file.yaml'
import icephys from './core/nwb.icephys.yaml'
import image from './core/nwb.image.yaml'
import misc from './core/nwb.misc.yaml'
import namespace from './core/nwb.namespace.yaml'
import ogen from './core/nwb.ogen.yaml'
import ophys from './core/nwb.ophys.yaml'
import retinotopy from './core/nwb.retinotopy.yaml'
import hdmfBase from './hdmf-common-schema/common/base.yaml'
import hdmfExperimental from './hdmf-common-schema/common/experimental.yaml'
import hdmfNamespace from './hdmf-common-schema/common/namespace.yaml'
import hdmfResources from './hdmf-common-schema/common/resources.yaml'
import hdmfSparse from './hdmf-common-schema/common/sparse.yaml'
import hdmfTable from './hdmf-common-schema/common/table.yaml'
import yaml from 'yaml'

const decode = (content) => yaml.parse(content)

// TODO: Generate NWB-Recognized Object
export const core = {
    base: decode(base), 
    behavior: decode(behavior),
    device: decode(device),
    ecephys: decode(ecephys),
    epoch: decode(epoch),
    file: decode(file),
    icephys: decode(icephys),
    image: decode(image),
    misc: decode(misc),
    namespace: decode(namespace),
    ogen: decode(ogen),
    ophys: decode(ophys),
    retinotopy: decode(retinotopy)
}


export const hdmf = {
    base: decode(hdmfBase),
    experimental: decode(hdmfExperimental),
    namespace: decode(hdmfNamespace),
    resources: decode(hdmfResources),
    sparse: decode(hdmfSparse),
    table:  decode(hdmfTable)
}