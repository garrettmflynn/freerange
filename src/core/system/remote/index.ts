import { PathType, SystemType, RemoteFileType, FileType } from "../../types"
import System from '../System'

export const createFile = (file: FileType = {}, path: PathType, system: System): RemoteFileType => {

    // Declare Remote File
    return Object.assign(file, {
        origin: system.root,
        path,
        options: {
            mode: 'cors' as RequestMode// Always enable CORS
        }
    })
}