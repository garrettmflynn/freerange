import pako from 'pako'
export const decode = (o) => {
    return new Promise((resolve, reject) => {
        try {
            o.buffer = pako.inflate(o.buffer).buffer
            resolve(o)
        } catch (e) {
          console.error(e)
          return reject(false)
        }
      })
}


export const encode = (o) => pako.deflate(o);

export const type = "application/x-gzip"
export const suffixes = 'gz'

