    // --------------- Unused Native Filesystem Methods --------------- 
    // dragHandler = async (e) => {
    //     e.preventDefault();

    //     const fileHandlesPromises = [...e.dataTransfer.items]
    //         .filter((item) => item.kind === 'file')
    //         .map((item) => item.getAsFileSystemHandle());

    //     for await (const handle of fileHandlesPromises) {
    //         this.createLocalFilesystem(handle)
    //     }
    // }

    // delete = async (name, parent) => {
    //     return await parent.removeEntry(name, { recursive: true });
    //     // OR await directoryHandle.remove();
    // }

    // rename = async (name) => {
    //     return await file.move(name);
    // }

    // move = async (directory, name) => {
    //     return await file.move(directory, name)
    // }

    // getPath = async (file, parent) => {
    //     return await parent.resolve(file);
    // }