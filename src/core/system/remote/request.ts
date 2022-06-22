import * as pathUtils from "../../utils/path"
import { PathType, AnyObj, TimeoutRequestInit, ResponseType } from "../../types"
import { ConfigType } from '../../types/config'


const networkErrorMessages = ['Failed to fetch', 'NetworkError when attempting to fetch resource.', 'Network request failed']

const isNetworkErrorMessage = (msg) => networkErrorMessages.includes(msg)
const isNetworkError = (error) => error.name === 'TypeError' && isNetworkErrorMessage(error.message)

const getURL = (path) => {
    let url
    try { url = new URL(path).href } 
    catch { url = pathUtils.get(path, window.location.href) }
    return url as string
}

export const handleFetch = async (path: PathType, options:TimeoutRequestInit={}, progressCallback?: ConfigType['progress']) => {
    if (!options.mode)  options.mode = 'cors' // Auto-CORS Support
    const url = getURL(path) 

    const response = await fetchRemote(url, options, progressCallback)
    if (!response) throw new Error('No response received.')
    const type = response.type.split(';')[0] // Get mimeType (not fully specified)

    return {
        url,
        type,
        buffer: response.buffer
    }
}

export const fetchRemote = async (url, options:TimeoutRequestInit={}, progressCallback?: ConfigType['progress']): Promise<ResponseType> => {

    options.timeout = 3000 // Default timeout at 3s
    const response = await fetchWithTimeout(url, options)

    return new Promise(async resolve => {

        if (response) {


            const type = response.headers.get('Content-Type')

            // Browser Remote Parser
            if (globalThis.FREERANGE_NODE) {
                const buffer = await response.arrayBuffer()
                resolve({buffer, type})
            }
            
            // Browser Remote Parser
            else {

                const reader = response.body.getReader();

                const bytes = parseInt(response.headers.get('Content-Length'), 10)
                let bytesReceived = 0
                let buffer = [];

                const processBuffer = async ({ done, value }) => {

                    if (done) {
                        const config: AnyObj = {}
                        if (typeof type === 'string') config.type = type
                        const blob = new Blob(buffer, config)
                        const ab = await blob.arrayBuffer()
                        resolve({buffer: new Uint8Array(ab), type})
                        return;
                    }

                    bytesReceived += value.length;
                    const chunk = value;
                    buffer.push(chunk);

                    if (progressCallback instanceof Function) progressCallback(response.headers.get('Range'), bytesReceived / bytes, bytes)

                    // Read some more, and call this function again
                    return reader.read().then(processBuffer)
                }

                reader.read().then(processBuffer);
            }

        } else {
            console.warn('Response not received!', options.headers)
            resolve(undefined)
        }
    })
}

async function fetchWithTimeout(resource, options:TimeoutRequestInit = {}) {
    const { timeout = 8000 } = options;
    
    const controller = new AbortController();
    const id = setTimeout(() => {

        // TODO: Ensure these request timeouts still result in the desired downstream effect
        console.warn(`Request to ${resource} took longer than ${(timeout/1000).toFixed(2)}s`)
        controller.abort()
        throw new Error(`Request timeout`)
    }, timeout);
    const response = await globalThis.fetch(resource, {
      ...options,
      signal: controller.signal  
    }).catch(e => {

        clearTimeout(id);
        const networkError = isNetworkError(e)
        if(networkError){
            throw new Error('No internet.')
         } else throw e
    })

    clearTimeout(id);

    if (!response.ok){
        if (response.status === 404) throw new Error(`Resource not found.`)
        else throw response
    }

    return response;
  }