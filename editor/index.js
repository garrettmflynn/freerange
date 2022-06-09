import * as visualscript from 'https://cdn.jsdelivr.net/npm/visualscript'
import * as files from '../freerange-core/src/index.js'


// -------------- Setup File Manager --------------
let file, app;

let tabs = {}
const manager = new files.FileManager({
    debug: true,
    ignore: ['DS_Store']
})

// -------------- Setup Elememts --------------
const select = document.querySelector('#select')
const save = document.querySelector('#save')
const displayName = document.querySelector('#name')

let globalMain = document.querySelector('#globalMain')
let appElement = document.querySelector('visualscript-app')
let appMainElement = appElement.querySelector('visualscript-main')

save.onclick = manager.save
select.onclick = () => manager.mount().then(onMount)


// -------------- Setup Keyboard Shortcuts --------------
document.onkeydown = async (e) => {
    if (e.metaKey && e.code == 'KeyS') {
        e.preventDefault()
        manager.save()
        app.active = false // stop other loops
        compile(file)
    }
};

// -------------- Handle Filesystem Mount --------------
const onMount = async (info) => {
    console.log('File System', info, manager)
    file = await manager.open('index.js')
    compile(file)
}

// -------------- Handle Brains@Play Application --------------
const compile = async (file) => {

    if (app) console.warn('Recompiling the application...')
    app = await manager.import(file)

    displayName.innerHTML = `${app.name}`
    appMainElement.innerHTML = `${app.name}`

    // Display Plugins
    const tabMap = new Map()

    let createdTabs = 0
    await Promise.all(manager.files.list.map(async f => {
        const tab = tabs[f.path]
        if (tab) return
        else {
            const tab = document.createElement('visualscript-tab')
            tab.name = f.path
            const texteditor = document.createElement('textarea')
            tab.appendChild(texteditor)
            texteditor.value = await f.body
            texteditor.oninput = (ev) => f.body = ev.target.value
            tabMap.set(f.path, tab)
            globalMain.appendChild(tab)
            tabs[f.path] = tab
            createdTabs++
        }
    }))

    if (createdTabs) globalMain.tabs = tabMap

    app.active = true
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
                        if (app.active) setTimeout(animate, 1000 / node.rate)
                    }
                    animate()
                })
            }
        }

        setup.forEach(f => f())
}