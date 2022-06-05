import yaml from 'yaml'
export default (o) => yaml.parse((!o.text) ? new TextDecoder().decode(o.buffer) : o.text)