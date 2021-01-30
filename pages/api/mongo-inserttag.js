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
  const tagsDB = db.collection("tags");
  const children = req.body.children;
  const parent = req.body.parent;
  var ObjectId = require('mongodb').ObjectId;
  const objid = new ObjectId();
  const name = req.body.name;
  const doc = {
    _id: objid,
    userid: userid,
    name: name,
    children: children,
    parent: parent
  };

  return new Promise((resolve, reject) => {
    tagsDB.insertOne(doc)
      .then(response => {
        res.statusCode = 200;
        res.json(objid);
        resolve();
      })
      .catch(err => {
        console.log('Mongo error: ', err);
        res.json(err);
        return resolve();
      });
  });
};
