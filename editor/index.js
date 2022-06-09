import * as files from '../freerange-core/src/index.js'


// -------------- Setup File Manager --------------
let file, plugins;
const manager = new files.FileManager({
    debug: true,
    ignore: ['DS_Store']
})

// -------------- Setup Elememts --------------
const texteditor = document.querySelector('textarea')
const select = document.querySelector('#select')
const save = document.querySelector('#save')
const displayName = document.querySelector('#name')

texteditor.oninput = (ev) => {
    if (file) file.body = ev.target.value
}

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
    const text = await file.body
    texteditor.value = text

    initializeApp()
}

// -------------- Handle Brains@Play Application --------------
const initializeApp = async () => {

    const app = await manager.import(file)
    displayName.innerHTML = `${app.name}`
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