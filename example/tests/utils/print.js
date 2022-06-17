export const system = async (system) => {
    console.log('Remote System', system.name)
    const files = Array.from(system.files.list.values())
    await Promise.all(files.map(async imported => {
        if (imported){
            const importedContents = await imported.body
            console.log(`${imported.path}`, importedContents)
        } else console.error('No Import')
    }))
}

export const file = async (file) => {
    const contents = await file.body
    console.log(`Existing ${file.name}`, contents)
}