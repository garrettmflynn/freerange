export const isURL = (path) => {
    try {
        const url = new URL(path)
        return true
    } catch {
        return false
    }
}