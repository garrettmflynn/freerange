const deepClone = (o={}) => {
    return JSON.parse(JSON.stringify(o))
}

export default deepClone