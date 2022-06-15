
    const verifyPermission = async (fileHandle, withWrite=false) => {
        const opts:FileSystemHandlePermissionDescriptor = {};
        if (withWrite) opts.mode = 'readwrite';

        const state = await fileHandle.queryPermission(opts)
        if (await state === 'granted') return true; // Check if we already have permission, if so, return true.

        const requestState = await fileHandle.requestPermission(opts)
        if (requestState === 'granted') return true;  // Request permission to the file, if the user grants permission, return true.

        return false; // The user did not grant permission, return false.
    }

    export default verifyPermission