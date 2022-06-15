export const encode = (o) => {
    var byteString = atob(o.split(',')[1]);
    // var mimeString = o.split(',')[0].split(':')[1].split(';')[0]
    const ab = new ArrayBuffer(byteString.length);
    var iab = new Uint8Array(ab);
    for (var i = 0; i < byteString.length; i++) {
        iab[i] = byteString.charCodeAt(i);
    }
    return iab
}


export const decode = (o) => o // Already has been converted to datauri...

export const mimeType = ['video/', 'image/']