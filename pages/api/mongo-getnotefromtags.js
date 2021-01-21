import { connectToDatabase } from "../../util/mongodb";

export default async (req, res) => {
  const { db } = await connectToDatabase();
  const tagsDB = db.collection("notes");
  const tags = req.body.tags;
  var objs = [];
  var ObjectId = require('mongodb').ObjectId;
  for(var n=0; n<tags.length; n++){
    objs[n]=[];
    for(var m=0; m<tags.length; m++){
      objs[n].push(new ObjectId(tags[n][m]));
    }
  }
  //tags is a 2d array:
  // tags[0]: {tag1, tag2, ... , tagn}
  //the find returns all notes that match 1 tag from every tags[i] array
  //the tags in tags[i] are "or'd", the arrays tags[n], tags[m] are "and'd"
  var query;
  console.log("HERE");
  if(tags.length==1){
    query = {
      tags: {
        $in: objs[0]
      }
    };
  }
  else{
    var and = [];
    for(var n=0; n<tags.length; n++){
      and.push({
        tags: {
          $in: objs[n]
        }
      });
    }
    query = {
      $and: and
    };
    console.log(query);
  }
  const options = {};

  const cursor = await tagsDB.find(query, options);
  const arr = await cursor.toArray();
  res.statusCode = 200;
  res.end(JSON.stringify(await arr));
};
