import * as visualscript from 'https://cdn.jsdelivr.net/npm/visualscript'
import * as files from '../freerange-core/src/index.js'


// -------------- Setup File Manager --------------
let file, plugins;
const manager = new files.FileManager({
    debug: true,
    ignore: ['DS_Store']
})

// -------------- Setup Elememts --------------
const select = document.querySelector('#select')
const save = document.querySelector('#save')
const displayName = document.querySelector('#name')
const main = document.querySelector('visualscript-main')

save.onclick = manager.save
select.onclick = () => manager.mount().then(onMount)


// -------------- Setup Keyboard Shortcuts --------------
document.onkeydown = async (e) => {
    if (e.metaKey && e.code == 'KeyS') {
        e.preventDefault()
        manager.save()
    }
};

// -------------- Handle Filesystem Mount --------------
const onMount = async (info) => {
    console.log('File System', info, manager)
    file = await manager.open('index.js')
    initializeApp(file)
}

// -------------- Handle Brains@Play Application --------------
const initializeApp = async (file) => {

    const app = await manager.import(file)
    displayName.innerHTML = `${app.name}`

    // Display Plugins
    const tabs = []

    await Promise.all(manager.files.list.map(async f => {
        const tab = document.createElement('visualscript-tab')
        tab.label = app.name
        const texteditor = document.createElement('textarea')
        tab.appendChild(texteditor)
        texteditor.value = await f.body
        texteditor.oninput = (ev) => f.body = ev.target.value
        tabs.push(tab)
        main.appendChild(tab)
    }))

    main.tabs = tabs

    // Start App
    start(app)
}

const start = async (app) => {

        const setup = []
        for (let name in app.graph) {

            const node = app.plugins[name]

            const onActivated = (targets, input) => {
                if (targets) targets.forEach(node => {
                    const output = node.function(input)
                    onActivated(app.graph[node.name]?.targets, output) // ASSUMPTION: Graph keys are named after the relevant plugin
                })
            }

            // Animate Nodes with a Specified Rate
            if (node.rate) {
                setup.push(() => {
                    let animate = () => {
                        const output = node.function()
                        onActivated(app.graph[name]?.targets, output)
                        setTimeout(animate, 1000 / node.rate)
                    }
                    animate()
                })
            }
        }

        setup.forEach(f => f())
}