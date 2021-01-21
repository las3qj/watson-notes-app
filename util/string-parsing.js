function caseInsensitiveSearch(string, nameToId){
  const keys = Object.keys(nameToId);
  const key = keys.find(el => el.toLowerCase() == string.toLowerCase());
  return key;
}

function specialCharacterParse(string){
  string = string.trim();
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
      path.push(string.substring(start, ind).trim());
    }
    start = ind + 1;
  }
  path.push(string.substring(start));
  return path;
}

function searchParse(string){
  //first trim the string
  string = string.trim();
  //search for special characters
  const regex = /[\/\\&|]/g;
  var indices = string.match(regex);
  //no matches, assume a single tag search
  if(indices==null){
    return {
      type: "tag",
      tag: string
    }
  }
  //if basckslash/forwardslash starts the string: special command
  if(indices[0]==="/" || indices[0]==="\\"){
    const index = string.indexOf(indices[0]);
    if(index == 0){
      const subS = string.substring(index+1).trim();
      var command;
      if(subS.indexOf(" ")>-1){
        command = subS.substring(0, subS.indexOf(" "));
      }
      else{
        command = subS.toLowerCase();
      }
      return{
        type:"command",
        command: command
      };
    }
  }
  //if and-ing tags:
  if(indices[0]==="&"){
    var start = 0;
    var index = string.indexOf("&");
    var tagArray = [];
    while(index>-1){
      var sub = string.substring(start, index);
      tagArray.push([sub.trim()]);
      start = index+1;
      index = string.indexOf("&", start);
    }
    var sub = string.substring(start).trim();
    tagArray.push([sub]);
    return{
      type: "andtags",
      tags: tagArray
    };
  }
  //if or-ing tags:
  if(indices[0]==="|"){
    var start = 0;
    var index = string.indexOf("|");
    var tagArray = [];
    tagArray[0] = [];
    while(index>-1){
      var sub = string.substring(start, index);
      tagArray[0].push(sub.trim());
      start = index+1;
      index = string.indexOf("|", start);
    }
    var sub = string.substring(start).trim();
    tagArray[0].push(sub);
    return{
      type: "ortags",
      tags: tagArray
    };
  }

  return "nothing";
}

export {caseInsensitiveSearch, specialCharacterParse, searchParse};
