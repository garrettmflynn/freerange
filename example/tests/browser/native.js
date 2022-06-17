import * as print from '../utils/print'

const nativeTests = async (config) => {

    console.log('------------------ NATIVE TESTS ------------------')
    const localSystem = new config.System()
    await localSystem.init()
    console.log('Filesystem Started!', localSystem)

    for (let key in config.native){
        console.log(`------------------ system.open (${key}) ------------------`)
        const info = config.native[key]
        const file = await localSystem.open(info.name, {
            create: true
        })//, {method: "native"})
        await print.file(file)
        await info.update(file)
    }

    await localSystem.save()
}

export default nativeTests