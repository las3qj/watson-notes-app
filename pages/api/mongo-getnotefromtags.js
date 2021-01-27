import { runMiddleware, connect, sessionUserId } from "../../util/database";
import Cors from 'cors'

// Initializing the cors middleware
const cors = Cors({
  origin: '*',
  methods: ['GET', 'HEAD', 'POST'],
})

export default async (req, res) => {
  await runMiddleware(req,res,cors);
  const userid = await sessionUserId(req);
  const { db } = await connect();
  const tagsDB = db.collection("notes");
  const tags = req.body.tags;
  //tags is a 2d array:
  // tags[0]: {tag1, tag2, ... , tagn}
  //the find returns all notes that match 1 tag from every tags[i] array
  //the tags in tags[i] are "or'd", the arrays tags[n], tags[m] are "and'd"
  var query;
  console.log("HERE");
  if(tags.length==1){
    query = {
      userid: userid,
      tags: {
        $in: tags[0]
      }
    };
  }
  else{
    var and = [{userid: userid}];
    for(var n=0; n<tags.length; n++){
      and.push({
        tags: {
          $in: tags[n]
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
