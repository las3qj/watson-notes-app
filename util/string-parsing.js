function caseInsensitiveSearch(string, tagsTable){
  const keys = Object.keys(tagsTable);
  const key = keys.find(el => el.toLowerCase() == string.toLowerCase());
  if(typeof key === 'undefined'){
    return undefined;
  }
  return key;
}

function specialCharacterParse(string){
  const regex = /[\/\\:>]/g;
  var indices = string.match(regex);
  if(indices==null){
    return [string];
  }
  var path = [];
  var start = (indices[0]==0) ? 1 : 0;
  var n = start;
  for(var n=start; n<indices.length; n++){
    const ind = string.indexOf(indices[n], start);
    if(ind!=start){
      path.push(string.substring(start, ind));
    }
    start = ind + 1;
  }
  path.push(string.substring(start));
  console.log("path: ",path);
  return path;
}

export {caseInsensitiveSearch, specialCharacterParse};
