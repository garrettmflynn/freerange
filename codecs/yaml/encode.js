import yaml from 'yaml'
export default (o) => new TextEncoder().encode(yaml.stringify(o))