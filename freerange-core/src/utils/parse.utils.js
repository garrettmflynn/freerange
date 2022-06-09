export const objToString = (obj) => {
    let ret = "{";
  
    for (let k in obj) {
      let v = obj[k];
  
      if (typeof v === "function") {
        v = v.toString();
      } else if (v instanceof Array) {
        v = JSON.stringify(v);
      } else if (typeof v === "object") {
        v = convert(v);
      } else {
        v = `"${v}"`;
      }
  
      ret += `\n  ${k}: ${v},`;
    }
  
    ret += "\n}";
  
    return ret;
}