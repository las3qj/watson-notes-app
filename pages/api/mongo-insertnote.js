import { connect } from "../../util/database";

export default async (req, res) => {
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
        console.log('Mongo error: ', err);
        res.json(err);
        return resolve();
      });
  });
};
