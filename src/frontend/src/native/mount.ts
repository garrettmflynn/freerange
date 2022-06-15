
const mountNative = async (handle?: FileSystemDirectoryHandle) => {
    if (!handle) handle = await window.showDirectoryPicker();
    return handle
}

export default mountNative