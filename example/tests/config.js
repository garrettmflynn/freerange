const csvUpdate = async (f) => {
    const contents = await f.body
    contents.push({ row: contents.length })
}

export default {
    native: {
        txt: {
            name: 'test.txt',
            update: (f) => f.body = 'Hello world!'
        },
        csv: {
            name: 'test.csv',
            update: csvUpdate
        },
        json: {
            name: 'test.json',
            update: (f) => f.body = { key: 'value', number: 1}
        },
        js: {
            name: 'test.js',
            update: (f) => f.body = `export default { ['test']: 'This is a test' }`
        },
        tsv: {
            name: 'test.tsv',
            update: csvUpdate
        },
    },
    remote: {
        esm: 'https://raw.githubusercontent.com/brainsatplay/brainsatplay-starter-kit/main/app/index.js',
        root: {
            base: 'https://raw.githubusercontent.com/brainsatplay/brainsatplay-starter-kit/main/README.md',
            html: 'index.html',
            js: 'app/index.js'
        },
        arbitrary: 'https://raw.githubusercontent.com/brainsatplay/freerange/main/README.md'
    }
}