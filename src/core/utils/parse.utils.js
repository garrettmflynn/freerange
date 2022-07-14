export var objToString = (obj) => {
  let ret = "{";
  for (let k in obj) {
    let v = obj[k];
    if (typeof v === "function") {
      v = v.toString();
    } else if (v instanceof Array) {
      v = JSON.stringify(v);
    } else if (typeof v === "object" && !!v) { // Pass on null and undefined
      v = objToString(v);
    } else if (typeof v === "string") {
      v = `"${v}"`;
    }
    else {
      v = `${v}`;
    }
    ret += `
  "${k}": ${v},`;
  }
  ret += "\n}";
  return ret;
};