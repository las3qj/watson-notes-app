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
  if(userid == "demo"){
    return new Promise((resolve, reject) => {
      res.json(userid);
      resolve();
    });
  }
  const { db } = await connect();
  const notes = db.collection("notes");
  const cont = req.body.content;
  const tags = req.body.tags;
  const wRecs = req.body.wRecs;
  const _id = req.body._id;
  var ObjectId = require('mongodb').ObjectId;
  const objid = new ObjectId();
  const doc = {
    _id: objid,
    userid: userid,
    content: cont,
    tags: tags,
    wRecs: wRecs};

  return new Promise((resolve, reject) => {
    notes.insertOne(doc)
      .then(response => {
        res.statusCode = 200;
        res.json(objid);
        resolve();
      })
      .catch(err => {
        res.json(err);
        return resolve();
      });
  });
};
