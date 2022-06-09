import sine from './plugins/sine/index.js'
import seconds from './plugins/time/index.js'
import log from './plugins/log.js'

export default {
    name: 'Test Application',
    graph: {
        seconds: {
            targets: [sine]
        },
        sine: {
            targets: [log]
        }
    },
    plugins: {sine, log, seconds}
}