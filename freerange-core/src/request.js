export default async (url, options, processCallback) => {

    const response = await fetch(url, options).catch(() => {})

    return new Promise(resolve => {

        if (response) {
            const reader = response.body.getReader();
            const bytes = parseInt(response.headers.get('Content-Length'), 10)

            const type = response.headers.get('Content-Type')


            let bytesReceived = 0
            let buffer = [];

            const processBuffer = async ({ done, value }) => {

                if (done) {
                    const config = {}
                    if (typeof type === 'string') config.type = type
                    const blob = new Blob(buffer, config)
                    const ab = await blob.arrayBuffer()
                    resolve(new Int8Array(ab))
                    return;
                }

                bytesReceived += value.length;
                const chunk = value;
                buffer.push(chunk);

                if (processCallback instanceof Function) processCallback(options?.headers?.Range, bytesReceived / bytes, bytes)

                // Read some more, and call this function again
                return reader.read().then(processBuffer)
            }

            reader.read().then(processBuffer);

        } else {
            console.warn('Response not received!', options.headers)
            resolve(new Uint8Array())
        }
    })
}