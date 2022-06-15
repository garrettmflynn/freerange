import * as freerange from '../dist/index.esm.js'
import * as print from './utils/print.js'

const manager = new freerange.FileManager({
    debug: true,
    ignore: ['.DS_Store']
})

const nativeTests = async (paths) => {

    console.log('freerange manager', manager)


    console.log('------------------ NATIVE TESTS ------------------')
    console.log('------------------ manager.mount ------------------')
    const localSystem = await manager.mount(undefined, {method: "native"})
    console.log('Mounted!', manager)

    for (let key in paths.local){
        console.log(`------------------ system.open (${key}) ------------------`)
        const info = paths.local[key]
        const file = await localSystem.open(info[name])//, {method: "native"})
        await print.file(file)
        await info.update(file)
    }

    localSystem.save()
}

export default nativeTests