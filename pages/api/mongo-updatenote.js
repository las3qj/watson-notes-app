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
  var ObjectId = require('mongodb').ObjectId;
  const id = req.body._id;
  const objid = new ObjectId(id);
  const content = req.body.content;
  const tags = req.body.tags;
  const wRecs = req.body.wRecs;

  const query = {
    _id: objid,
    userid: userid
  };
  var update = {
    $set: {
      content: content,
      tags: tags,
      wRecs: wRecs
    }
  };
  console.log("q: ",query);
  console.log("u: ", update);
  return new Promise((resolve, reject) => {
    tagsDB.updateOne(query, update)
      .then(response => {
        res.statusCode = 200;
        res.end();
        resolve();
      })
      .catch(err => {
        console.log('Mongo error: ', err);
        res.json(err);
        return resolve();
      });
  });
};
